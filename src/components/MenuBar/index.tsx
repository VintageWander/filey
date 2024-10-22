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
