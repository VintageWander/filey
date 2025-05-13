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

import { useMantineColorScheme, Button, useMantineTheme } from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";

export const ThemeToggle = () => {
  const { setColorScheme } = useMantineColorScheme();
  const { colors } = useMantineTheme();

  return (
    <>
      {/* Moon button - Only shown on dark mode */}
      <Button
        variant="light"
        size="md"
        px="5px"
        color={colors.blue[3]}
        onClick={() => setColorScheme("light")}
        lightHidden
      >
        <IconMoon color={colors.blue[3]} size={"2em"} />
      </Button>

      {/* Sun button - Only shown on light mode */}
      <Button
        variant="light"
        size="md"
        px="5px"
        color={colors.orange[4]}
        onClick={() => setColorScheme("dark")}
        darkHidden
      >
        <IconSun color={colors.orange[4]} size={"2em"} />
      </Button>
    </>
  );
};
