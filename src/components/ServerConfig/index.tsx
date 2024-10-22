import { Button, Group, Stack, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { connectedToAtom, localIpsAtom, serverStatusAtom } from "../../store";
import { capitalLetter } from "../../utils";
import { FaWifi } from "react-icons/fa6";
import { FiCloud, FiCloudOff } from "react-icons/fi";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";

export const ServerConfig = () => {
  const [connectedTo] = useAtom(connectedToAtom);
  const [serverStatus, setServerStatus] = useAtom(serverStatusAtom);
  const [localIps, setLocalIps] = useAtom<string[]>(localIpsAtom);

  const isLocal = connectedTo === "This machine";
  const isOnline = serverStatus === "online";

  useEffect(() => {
    invoke<string[]>("local_ips").then(setLocalIps).catch(error);
  }, []);

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
        {isOnline ? (
          <Stack>
            {localIps.map((ip) => (
              <code key={ip}>{ip}:38899</code>
            ))}
          </Stack>
        ) : (
          "Currently offline"
        )}
      </Group>
    </Stack>
  );
};
