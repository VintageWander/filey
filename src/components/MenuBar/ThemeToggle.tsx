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

import {
  Button,
  useComputedColorScheme,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { FaMoon } from "react-icons/fa";
import { FaSun } from "react-icons/fa6";

export const ThemeToggleButton = () => {
  const { setColorScheme } = useMantineColorScheme();
  const theme = useComputedColorScheme();
  const colors = useMantineTheme().colors;
  return (
    <Button
      variant="subtle"
      size="md"
      px="5px"
      color={theme === "light" ? colors.orange[3] : colors.blue[4]}
      onClick={() => {
        setColorScheme(theme === "light" ? "dark" : "light");
      }}
    >
      {theme === "light" ? <FaSun size="2em" /> : <FaMoon size="2em" />}
    </Button>
  );
};
