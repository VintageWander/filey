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

import { Group, Text } from "@mantine/core";
import { ThemeToggleButton } from "./ThemeToggle";

export const MenuBar = () => {
  return (
    <Group justify="space-between" mx="lg" my="md">
      <Text
        size="2em"
        fw={900}
        variant="gradient"
        gradient={{ from: "orange", to: "lime", deg: 90 }}
      >
        Filey
      </Text>
      <div />
      <ThemeToggleButton />
    </Group>
  );
};
