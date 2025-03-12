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
import { FileModel, Peer } from "@/models";
import { type as osType } from "@tauri-apps/plugin-os";

// Host OS
export const hostOs = osType();

// File list
export const filesAtom = atom<FileModel[]>([]);

/*
  Connected device
  Type: string
  Possible values: "This machine" | <local ip address 1> | <local ip address 2> | ...
*/
export const connectedToAtom = atom<Peer>({
  address: "This machine",
  osType: hostOs,
} satisfies Peer);
export const isLocalAtom = atom<boolean>(
  (get) => get(connectedToAtom).address === "This machine"
);
export const isExternalAtom = atom<boolean>(
  (get) => get(connectedToAtom).address !== "This machine"
);

/*
  Server status
  Type: string
  Possible values: "online" | "offline"
*/
export const serverStatusAtom = atom<"online" | "offline">("offline");
export const isOnlineAtom = atom<boolean>(
  (get) => get(serverStatusAtom) === "online"
);

/*
  Host machine's local ip addresses
  Type: string[]
  Possible values: [<ip1>, <ip2>, <ip3>]
  Why a string array? One device could have multiple interfaces, and they each have their own local ip address
  However we're not listing all of them, instead this array only keeps private ip address (172.16.x.x, 192.168.x.x, 10.0.x.x)
*/
export const localIpsAtom = atom<string[]>([]);

// Checks if it is a desktop
export const isDesktopAtom = atom<boolean>(
  (_get) => hostOs === "macos" || hostOs === "windows" || hostOs === "linux"
);

/*
  List of scanned Filey peers within the local network
  This will store peers from all network interfaces of the host machine
*/
export const peersAtom = atom<Peer[]>([]);
