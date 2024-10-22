import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { MenuBar } from "./components/MenuBar";

export default function App() {
  return (
    <MantineProvider>
      <MenuBar />
    </MantineProvider>
  );
}
