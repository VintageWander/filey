import "@mantine/core/styles.css";

import { Container, Divider, MantineProvider } from "@mantine/core";
import { MenuBar } from "./components/MenuBar";
import { ServerConfig } from "./components/ServerConfig";

export default function App() {
  return (
    <MantineProvider>
      <MenuBar />
      <Container>
        <Divider label="Server Config" my="lg" />
        <ServerConfig />
        <Divider label="File list" my="lg" />
      </Container>
    </MantineProvider>
  );
}
