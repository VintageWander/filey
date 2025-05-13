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

import { Button, Text, CopyButton as CopyButtonInner } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";

// Copy link button, copy icon will change to check icon on click
export const CopyButton = ({
  url,
  title = "Copy",
}: {
  url: string;
  title?: string;
}) => {
  return (
    <CopyButtonInner value={url} timeout={1500}>
      {({ copied, copy }) => (
        <Button
          h={title === "Copy" ? "35px" : "55px"}
          px={title === "Copy" ? "10px" : "12px"}
          color={copied ? "teal" : "cyan"}
          variant="subtle"
          onClick={copy}
          leftSection={copied ? <IconCheck /> : <IconCopy />}
        >
          {title === "Copy" ? (
            title
          ) : (
            <Text style={{ textWrap: "wrap" }}>{title}</Text>
          )}
        </Button>
      )}
    </CopyButtonInner>
  );
};
