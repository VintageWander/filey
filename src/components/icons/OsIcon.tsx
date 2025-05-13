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

import {
  IconBrandAndroid,
  IconBrandApple,
  IconBrandQq,
  IconBrandWindows,
  IconDevicesQuestion,
} from "@tabler/icons-react";
import { OsType } from "@tauri-apps/plugin-os";

// Shows os icon based on props
export const OsIcon = ({ os }: { os: OsType }) =>
  os === "android" ? (
    <IconBrandAndroid />
  ) : os === "ios" || os === "macos" ? (
    <IconBrandApple />
  ) : os === "linux" ? (
    <IconBrandQq />
  ) : os === "windows" ? (
    <IconBrandWindows />
  ) : (
    <IconDevicesQuestion />
  );
