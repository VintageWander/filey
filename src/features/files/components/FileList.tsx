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
"use client";

import { useAtom } from "jotai";
import { databaseReadyAtom, filesAtom } from "../store";
import { connectedToAtom, isFileyLocalAtom } from "@/features/server/store";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { v4 } from "uuid";
import { FileModel } from "../types";
import { useEffect } from "react";
import { Text, Group, Button, Stack, Loader } from "@mantine/core";
import { IconFileImport, IconRefresh } from "@tabler/icons-react";
import { FileItem } from "./FileItem";
import useAsyncEffect from "use-async-effect";

export const FileList = () => {
  /**
   * States
   */
  const [files, setFiles] = useAtom(filesAtom);
  const [databaseReady, checkDatabaseReady] = useAtom(databaseReadyAtom);

  const [connectedTo] = useAtom(connectedToAtom);
  const [isFileyLocal] = useAtom(isFileyLocalAtom);

  /**
   * Utils
   */

  /**
   * Adding new files to the list
   * Using tauri's file picker to get file paths
   */
  const addFiles = async () => {
    const paths: string[] | null = await openFileDialog({
      multiple: true,
      directory: false,
    });
    if (!paths) return;

    // Convert the added file paths into FileModel
    const inputFiles: FileModel[] = paths.map((path) => {
      return {
        id: v4(),
        name: path.split("/").pop()!,
        mime: "",
        visibility: "private",
        path,
      } satisfies FileModel;
    });

    setFiles({ type: "upsert", files: inputFiles });
  };

  const refresh = async () => {
    if (isFileyLocal) {
      await setFiles();
    } else {
      await setFiles({ type: "external", ip: connectedTo.address });
    }
  };

  /**
   * Effects
   */
  /**
   * Checks if the database is ready
   * Run once every 2 seconds, and stops when the database is ready
   * This will run at application startup
   */
  useAsyncEffect(async () => {
    await checkDatabaseReady();
  }, []);

  useEffect(() => {
    if (!databaseReady) {
      const intervalId = setInterval(
        async () => await checkDatabaseReady(),
        2000
      );
      return () => clearInterval(intervalId);
    }
  }, [databaseReady]);

  useEffect(() => {
    const intervalId = setInterval(refresh, 2000);
    return () => clearInterval(intervalId);
  }, [connectedTo]);

  useAsyncEffect(async () => {
    await refresh();
  }, [connectedTo]);

  /**
   * Render
   */
  return (
    <>
      {/* Horizontal group */}

      {/* Import file button - triggers addFiles function */}
      <Group justify="space-between">
        <Button
          color="lime"
          disabled={!databaseReady || !isFileyLocal}
          leftSection={<IconFileImport />}
          onClick={() => addFiles()}
        >
          Import file
        </Button>

        {
          /*
            Refresh button, only available when the database is ready
            Triggers a files refetch
          */
          databaseReady && (
            <Button
              variant="subtle"
              leftSection={<IconRefresh />}
              onClick={refresh}
            >
              Refresh
            </Button>
          )
        }

        {/* File list, if the database is not ready, shows loading spinner */}
        <Stack w="100%" h="40vh" justify="flex-start" align="center" mt="xs">
          {databaseReady ? (
            files.map((file) => <FileItem key={file.id} file={file} />)
          ) : (
            <>
              <Loader color="lime" size="xl" />
              <Text c="gray">Loading the database</Text>
            </>
          )}
        </Stack>
      </Group>
    </>
  );
};
