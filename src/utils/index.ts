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

import { OsType } from "@tauri-apps/plugin-os";

export const capitalLetter = (str: string): string => {
  return str[0].toUpperCase() + str.slice(1);
};

export const printLocalMachineName = (host: OsType, existsBattery: boolean) => {
  return `This ${
    host === "macos" || host === "windows" || host === "linux"
      ? existsBattery
        ? " laptop"
        : " desktop"
      : host === "android" || host === "ios"
      ? " phone"
      : " unknown device"
  }`;
};

export const filterDuplicate = <T extends Record<K, any>, K extends keyof T>(
  array: T[],
  property: K
): T[] => {
  const uniqueMap = new Map<T[K], T>(); // Map to store unique items, keyed by property value

  array.forEach((item) => {
    const value = item[property];
    if (!uniqueMap.has(value)) {
      // If the map doesn't have this key yet
      uniqueMap.set(value, item); // Add the item to the map
    }
  });

  // Convert the map values back to an array
  return Array.from(uniqueMap.values());
};
