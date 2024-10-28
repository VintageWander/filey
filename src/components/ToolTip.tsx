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
  Tooltip as TooltipInner,
  Text,
  useComputedColorScheme,
} from "@mantine/core";
import React from "react";

// A small tooltip that shows on hover or touch, change color on app theme
export const Tooltip = ({
  label,
  disabled = false,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: React.JSX.Element;
}) => {
  const colorScheme = useComputedColorScheme();
  return (
    <TooltipInner
      multiline
      disabled={disabled}
      maw={"95%"}
      label={
        <Text size="sm" truncate>
          {label}
        </Text>
      }
      color={colorScheme === "light" ? "white" : "gray"}
      events={{ hover: true, focus: false, touch: true }}
    >
      {children}
    </TooltipInner>
  );
};
