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

import { OsType } from "./models";

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
