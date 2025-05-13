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

import { invoke } from "@tauri-apps/api/core";
import { atom } from "jotai";
import { Peer } from "../types";
import { OsType } from "@tauri-apps/plugin-os";
// import { atomWithRefresh, unwrap } from "jotai/utils";

/**
 * OS info
 */

// export const osInfoAtom = unwrap<Promise<OsType>, [], void, OsType>(
//   atomWithRefresh(async () => await invoke<OsType>("os_info")),
//   (prev) => prev ?? "linux"
// );

const osInfo = atom<OsType>("linux");
export const osInfoAtom = atom(
  (get) => get(osInfo),
  async (_, set) => set(osInfo, await invoke<OsType>("os_info"))
);

export const isDesktopAtom = atom<boolean>((get) => {
  const os = get(osInfoAtom);
  return os === "macos" || os === "windows" || os === "linux";
});

/**
 * Device's local ips reported from network interface
 */

// export const localIpsAtom = unwrap<Promise<string[]>, [], void, string[]>(
//   atomWithRefresh(async () => await invoke<string[]>("local_ips")),
//   (prev) => prev ?? []
// );

const localIps = atom<string[]>([]);
export const localIpsAtom = atom(
  (get) => get(localIps),
  async (_, set) => set(localIps, await invoke<string[]>("local_ips"))
);

/**
 * Check if the device has battery or not, to determine if the device running is a desktop PC or mobile/laptop
 */
// export const hasBatteryAtom = unwrap<Promise<boolean>, [], void, boolean>(
//   atomWithRefresh(async () => await invoke<boolean>("has_battery")),
//   (prev) => prev ?? false
// );

const hasBattery = atom<boolean>(false);
export const hasBatteryAtom = atom(
  (get) => get(hasBattery),
  async (_, set) => set(hasBattery, await invoke<boolean>("has_battery"))
);

/**
 * Currently connected Filey peer
 */
const connectedTo = atom<Peer>({
  address: "This machine",
  osType: "linux",
} satisfies Peer);

export const connectedToAtom = atom(
  (get) => get(connectedTo),
  /**
   * This set function has 2 ways of using
   * - If 0 parameter provided -> fetches current information
   * - If 1 paramter provided (replacement?: Peer) -> replaces the current state
   */
  (get, set, replacement?: Peer) => {
    set(
      connectedTo,
      replacement ?? {
        address: "This machine",
        osType: get(osInfoAtom),
      }
    );
  }
);

export const isFileyLocalAtom = atom<boolean>(
  (get) => get(connectedToAtom).address === "This machine"
);

export const isFileyExternalAtom = atom<boolean>(
  (get) => get(connectedToAtom).address !== "This machine"
);

/**
 * Indicate if the hosting mode turned on / off
 */
const serverStatus = atom<"online" | "offline">("offline");
export const serverStatusAtom = atom(
  (get) => get(serverStatus),
  (get, set) => {
    const status = get(serverStatus);
    if (status === "online") {
      set(serverStatus, "offline");
      invoke("stop_server");
    } else if (status === "offline") {
      set(serverStatus, "online");
      invoke("start_server");
    }
  }
);

export const isServerOnlineAtom = atom<boolean>(
  (get) => get(serverStatusAtom) === "online"
);

/**
 * List of seen Filey peers
 */

const peers = atom<Peer[]>([]);

export const peersAtom = atom(
  (get) => get(peers),
  (get, set) => {
    const localIps = get(localIpsAtom);
    set(peers, []);
    localIps.forEach((ip) => {
      const splitIp = ip.split("."); // 192.168.1.10 -> [192, 168, 1, 10]
      const originalEndIp = Number(splitIp.pop()); // 10
      const baseIp = splitIp.join("."); // 192.168.1
      // Looping from 192.168.1.1 -> 192.168.1.255
      for (let endIp = 1; endIp <= 255; ++endIp) {
        /**
         * Make a query to http://192.168.1.x:38899/info to get information on every interation of the loop,
         * exclude the case of x equals to originalEndIp to prevent self connecting
         */
        if (originalEndIp != endIp) {
          invoke<Peer>("check_peer", {
            ip: `${baseIp}.${endIp}`,
          })
            // If query success, add to the list of peers
            .then((peer) => set(peers, [...get(peers), peer]))
            // Just ignores if query failed
            // I must add this or else dev console will scream Unhandled Promise exception
            .catch(() => {});
        }
      }
    });
  }
);
