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

import "@mantine/core/styles.css";

import {
  ColorSchemeScript,
  Container,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { Provider as JotaiProvider } from "jotai";
import { MenuBar } from "@/components/layouts/MenuBar";

export const metadata = {
  title: "Filey",
  description: "A quick and easy file sending utility",
};

export default ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <JotaiProvider>
          <MantineProvider defaultColorScheme="dark">
            <MenuBar />
            <Container
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
              }}
            >
              {children}
            </Container>
          </MantineProvider>
        </JotaiProvider>
      </body>
    </html>
  );
};
