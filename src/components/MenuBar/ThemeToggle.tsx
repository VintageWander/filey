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
