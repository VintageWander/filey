/*
  Filey - simple peer-to-peer file sending across devices on different platforms
  Copyright (C) 2024 Wander Watterson

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

// import { atomWithRefresh, unwrap } from "jotai/utils";
import { invoke } from "@tauri-apps/api/core";
import { atom } from "jotai";
import { FileModel, FileResponse } from "../types";
import { connectedToAtom, osInfoAtom } from "@/features/server/store";
import { filterDuplicate } from "@/utils";

/**
 * Checks if the database is ready for use
 */

// export const databaseReadyAtom = unwrap<Promise<boolean>, [], void, boolean>(
//   atomWithRefresh<Promise<boolean>>(
//     async () => await invoke<boolean>("database_ready")
//   ),
//   (prev) => prev ?? false
// );

const databaseReady = atom<boolean>(false);
export const databaseReadyAtom = atom(
  (get) => get(databaseReady),
  async (_, set) => set(databaseReady, await invoke<boolean>("database_ready"))
);

/**
 * Temporary storing a list of files, it could be internal or external
 * Used for rendering in a file list
 */
const files = atom<FileModel[]>([]);
export const filesAtom = atom(
  (get) => get(files),
  /**
   * This implementation is a bit hacky, I should've used a store-like state manager
   * This is the only way that I can implement multiple operation type within one function
   * If you're using something like Valtio, it should've been multiple functions, like
   * dedicated `upsert`, `fetchExternal` or `update` functions
   */
  async (
    get,
    set,
    args?:
      | { type: "upsert"; files: FileModel[] }
      | { type: "external"; ip: string }
      | { type: "delete"; id: string }
  ): Promise<void> => {
    // If argument is provided
    if (args) {
      /**
       * If argument have type === "upsert" -> We're doing an upsert
       */
      if (args.type === "upsert") {
        // Filter duplicates from the list of files provided from the parameter
        const uniqueFiles = filterDuplicate(args.files, "path");
        // Set the internal file state
        set(files, uniqueFiles);
        // Also upsert the list of files in the database
        await invoke<FileModel[]>("upsert_files", { files: uniqueFiles });
      }
      // If argument includes the ip field
      else if (args.type === "external") {
        // Query the list of files from the provided IP address
        const externalFiles = await invoke<FileResponse[]>(
          "get_files_from_peer",
          { ip: args.ip }
        );

        // If there isn't, reset the current connected to state
        if (!externalFiles) {
          set(connectedToAtom, {
            address: "This machine",
            osType: get(osInfoAtom),
          });
          // Call this set function without any parameter,
          // so it executes the bottom code block
          set(filesAtom);
        }
        // Set the files state to external file list
        else {
          set(
            files,
            externalFiles.map(({ id, name, mime }) => {
              return {
                id,
                name,
                mime,
                visibility: "public",
                path: "Unknown",
              } satisfies FileModel;
            })
          );
        }
      } else if (args.type === "delete") {
        set(
          files,
          get(files).filter((file) => file.id !== args.id)
        );
        await invoke("delete_file", { id: args.id });
      }
    }
    // If no arguments provided -> Refresh the file list
    else {
      let localFiles = await invoke<FileModel[]>("get_files");

      if (localFiles.length) {
        localFiles.forEach(async ({ id, path }) => {
          const fileExists = await invoke<boolean>("file_exists", { path });

          if (!fileExists) {
            set(
              files,
              localFiles.filter((file) => file.id !== id)
            );
            await invoke("delete_file", { id });
          }
        });
      }

      set(files, localFiles);
    }
  }
);
