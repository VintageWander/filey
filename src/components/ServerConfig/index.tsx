import { Button, Group, Stack, Text } from "@mantine/core";
import { useAtom } from "jotai";
import {
  connectedToAtom,
  hostOsAtom,
  isLocalAtom,
  isOnlineAtom,
  localIpsAtom,
  serverStatusAtom,
} from "@/store";
import { capitalLetter, printLocalMachineName } from "@/utils";
import { FiCloud, FiCloudOff } from "react-icons/fi";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { useInterval } from "@mantine/hooks";
import { OsIcon } from "@/components/OsIcon";

export const ServerConfig = () => {
  const [connectedTo] = useAtom(connectedToAtom);
  const [serverStatus, setServerStatus] = useAtom(serverStatusAtom);
  const [localIps, setLocalIps] = useAtom<string[]>(localIpsAtom);

  const [isLocal] = useAtom(isLocalAtom);
  const [isOnline] = useAtom(isOnlineAtom);

  const [hostOs] = useAtom(hostOsAtom);
  const [existsBattery, setExistsBattery] = useState<boolean>(true);

  useEffect(() => {
    invoke<string[]>("local_ips").then(setLocalIps).catch(error);
    invoke<boolean>("check_battery").then(setExistsBattery).catch(error);
  }, []);

  const getLocalIpsInterval = useInterval(
    () => invoke<string[]>("local_ips").then(setLocalIps).catch(error),
    6000
  );
  useEffect(() => {
    const { start, stop } = getLocalIpsInterval;
    start();
    return stop;
  }, []);

  return (
    <Stack>
      {/* Connected to */}
      <Group justify="space-between">
        <Text>Connected to:</Text>
        <Button color="cyan" leftSection={<OsIcon os={hostOs} />}>
          {isLocal ? printLocalMachineName(hostOs, existsBattery) : connectedTo}
        </Button>
      </Group>

      {/* Server status */}
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

      {/* Local ip addresses */}
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
