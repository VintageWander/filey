/*
  Filey - simple peer-to-peer file sending across devices on different platforms
  Copyright (C) 2024 Wander Watterson

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { atom } from "jotai";
import { FileModel, OsType, Peer } from "@/models";
import { type as osType } from "@tauri-apps/plugin-os";

// File list
export const filesAtom = atom<FileModel[]>([]);

// Server config related store
export const connectedToAtom = atom<string>("This machine");
export const isLocalAtom = atom<boolean>(
  (get) => get(connectedToAtom) === "This machine",
);
export const isExternalAtom = atom<boolean>(
  (get) => get(connectedToAtom) !== "This machine",
);

export const serverStatusAtom = atom<"online" | "offline">("offline");
export const isOnlineAtom = atom<boolean>(
  (get) => get(serverStatusAtom) === "online",
);

export const localIpsAtom = atom<string[]>([]);

export const hostOsAtom = atom<OsType>((_) => osType());

export const isDesktopAtom = atom<boolean>((get) => {
  let os = get(hostOsAtom);
  return os === "macos" || os === "windows" || os === "linux";
});

export const peersAtom = atom<Peer[]>([]);
