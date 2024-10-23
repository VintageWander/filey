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
import { useDisclosure } from "@mantine/hooks";
import { OsIcon } from "@/components/OsIcon";
import { ConnectModal } from "./ConnectModal";

export const ServerConfig = () => {
  // ------------------------------ State --------------------------------

  const [connectedTo] = useAtom(connectedToAtom);
  const [serverStatus, setServerStatus] = useAtom(serverStatusAtom);
  const [localIps, setLocalIps] = useAtom<string[]>(localIpsAtom);

  const [isLocal] = useAtom(isLocalAtom);
  const [isOnline] = useAtom(isOnlineAtom);

  const [hostOs] = useAtom(hostOsAtom);
  const [existsBattery, setExistsBattery] = useState<boolean>(true);

  const [opened, { open, close }] = useDisclosure(false);

  // ------------------------------ Effects --------------------------------

  useEffect(() => {
    invoke<string[]>("local_ips").then(setLocalIps).catch(error);
    invoke<boolean>("check_battery").then(setExistsBattery).catch(error);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(
      () => invoke<string[]>("local_ips").then(setLocalIps).catch(error),
      6000
    );
    return () => clearInterval(intervalId);
  }, []);

  // ------------------------------ Render --------------------------------

  return (
    <>
      <ConnectModal opened={opened} closeModal={close} />
      <Stack>
        {/* Connected to */}
        <Group justify="space-between">
          <Text>Connected to:</Text>
          <Button
            color="cyan"
            onClick={open}
            leftSection={<OsIcon os={hostOs} />}
          >
            {isLocal
              ? printLocalMachineName(hostOs, existsBattery)
              : connectedTo}
          </Button>
        </Group>

        {
          /* Server status */
          isLocal && (
            <Group justify="space-between">
              <Text>Server status:</Text>
              <Button
                color={isOnline ? "lime" : "gray"}
                leftSection={isOnline ? <FiCloud /> : <FiCloudOff />}
                onClick={() => {
                  if (serverStatus === "online") {
                    invoke("stop_server");
                    setServerStatus("offline");
                  } else if (serverStatus === "offline") {
                    invoke("start_server");
                    setServerStatus("online");
                  }
                }}
              >
                {capitalLetter(serverStatus)}
              </Button>
            </Group>
          )
        }

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
    </>
  );
};
