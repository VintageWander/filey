import { Button, Group, Stack, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { connectedToAtom, serverStatusAtom } from "../../store";
import { capitalLetter } from "../../utils";
import { FaWifi } from "react-icons/fa6";
import { FiCloud, FiCloudOff } from "react-icons/fi";

export const ServerConfig = () => {
  const [connectedTo] = useAtom(connectedToAtom);
  const [serverStatus, setServerStatus] = useAtom(serverStatusAtom);

  const isOnline = serverStatus === "online";

  return (
    <Stack>
      <Group justify="space-between">
        <Text>Connected to:</Text>
        <Button color="cyan" leftSection={<FaWifi />}>
          {connectedTo}
        </Button>
      </Group>
      <Group justify="space-between">
        <Text>Server status:</Text>
        <Button
          color={isOnline ? "lime" : "gray"}
          leftSection={isOnline ? <FiCloud /> : <FiCloudOff />}
          onClick={() => setServerStatus(isOnline ? "offline" : "online")}
        >
          {capitalLetter(serverStatus)}
        </Button>
      </Group>
      <Group justify="space-between">
        <Text>Local IP addresses:</Text>
        <Text>192.168.1.1</Text>
      </Group>
    </Stack>
  );
};
