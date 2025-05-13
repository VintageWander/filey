/*
  Filey - simple peer-to-peer file sending across devices on different platforms
  Copyright (C) 2024 Wander Watterson

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

"use client";

import { useAtom } from "jotai";
import {
  connectedToAtom,
  hasBatteryAtom,
  isFileyLocalAtom,
  isServerOnlineAtom,
  localIpsAtom,
  osInfoAtom,
  serverStatusAtom,
} from "../store";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import { Text, Button, Group, Stack } from "@mantine/core";
import { OsIcon } from "@/components/icons/OsIcon";
import { capitalLetter, printLocalMachineName } from "@/utils";
import { IconCloud, IconCloudOff } from "@tabler/icons-react";
import { ConnectModal } from "./ConnectModal";
import useAsyncEffect from "use-async-effect";

export const ServerConfig = () => {
  /**
   * States
   */
  const [osInfo, refreshOsInfo] = useAtom(osInfoAtom);
  const [connectedTo, setConnectedTo] = useAtom(connectedToAtom);
  const [serverStatus, toggleServer] = useAtom(serverStatusAtom);
  const [localIps, refreshLocalIps] = useAtom(localIpsAtom);

  const [isFileyLocal] = useAtom(isFileyLocalAtom);
  const [isServerOnline] = useAtom(isServerOnlineAtom);

  const [hasBattery, recheckBattery] = useAtom(hasBatteryAtom);

  const [
    connectModalOpened,
    { open: openConnectModal, close: closeConnectModal },
  ] = useDisclosure(false);

  /**
   * Effects
   */

  useAsyncEffect(async () => {
    await refreshOsInfo();
    await refreshLocalIps();
    await recheckBattery();
    setConnectedTo();
  }, []);

  useEffect(() => {
    /**
     * Refreshes the list of private local IPs every 6 seconds
     */
    const intervalId = setInterval(refreshLocalIps, 6000);
    return () => clearInterval(intervalId);
  }, []);

  /**
   * Render
   */
  return (
    <>
      <ConnectModal
        opened={connectModalOpened}
        closeModal={closeConnectModal}
      />

      <Stack>
        {/* Connected to */}
        <Group justify="space-between">
          <Text>Connected to:</Text>
          <Button
            color="cyan"
            onClick={openConnectModal}
            leftSection={<OsIcon os={connectedTo.osType} />}
          >
            {isFileyLocal
              ? printLocalMachineName(connectedTo.osType, hasBattery)
              : connectedTo.address}
          </Button>
        </Group>

        {
          /* Server status */
          isFileyLocal && (
            <Group justify="space-between">
              <Text>Server status:</Text>
              <Button
                color={isServerOnline ? "lime" : "gray"}
                leftSection={isServerOnline ? <IconCloud /> : <IconCloudOff />}
                onClick={() => toggleServer()}
              >
                {capitalLetter(serverStatus)}
              </Button>
            </Group>
          )
        }

        {
          /* Local ip addresses */
          isFileyLocal && (
            <Group justify="space-between" align="flex-start">
              <Text>Local IP addresses:</Text>
              {isServerOnline ? (
                <Stack>
                  {localIps.map((ip) => (
                    <code key={ip}>{ip}:38899</code>
                  ))}
                </Stack>
              ) : (
                "Currently offline"
              )}
            </Group>
          )
        }
      </Stack>
    </>
  );
};
