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

import "@mantine/core/styles.css";

import { Container, Divider, MantineProvider } from "@mantine/core";
import { MenuBar } from "./components/MenuBar";
import { ServerConfig } from "./components/ServerConfig";
import { FileList } from "./components/FileList";

export default function App() {
  return (
    <MantineProvider>
      <MenuBar />
      <Container>
        <Divider label="Server Config" my="lg" />
        <ServerConfig />
        <Divider label="File list" my="lg" />
        <FileList />
      </Container>
    </MantineProvider>
  );
}
