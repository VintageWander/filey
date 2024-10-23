import { Group } from "@mantine/core";
import { FileIcon as FileLogo } from "react-file-icon";

export const FileIcon = ({ extension }: { extension: string }) => {
  return (
    <Group w="35px" pl="xs" align="center">
      <FileLogo extension={extension} />
    </Group>
  );
};
