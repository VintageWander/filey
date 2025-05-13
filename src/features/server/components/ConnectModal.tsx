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
  osInfoAtom,
  peersAtom,
} from "../store";
import { useEffect, useState } from "react";
import { OsIcon } from "@/components/icons/OsIcon";
import { printLocalMachineName } from "@/utils";
import { Modal, Stack, Group, Button, Text } from "@mantine/core";
import { IconCircleArrowRightFilled } from "@tabler/icons-react";

export const ConnectModal = ({
  opened,
  closeModal,
}: {
  opened: boolean;
  closeModal: () => void;
}) => {
  /**
   * States
   */
  const [osInfo] = useAtom(osInfoAtom);
  const [, setConnectedTo] = useAtom(connectedToAtom);
  const [peers, refreshPeers] = useAtom(peersAtom);

  const [hasBattery] = useAtom(hasBatteryAtom);

  const [seconds, setSeconds] = useState<number>(5);

  /**
   * Effects
   */

  // Reset the second counter
  useEffect(() => {
    // Refresh the peers list every 5 seconds
    if (seconds === 0) refreshPeers();

    const intervalId = setInterval(() => {
      setSeconds(seconds > 0 ? seconds - 1 : 5);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [seconds]);

  useEffect(() => {
    refreshPeers();
  }, []);

  /**
   * Render
   */
  /* Connection manager modal */
  return (
    <Modal
      size={"lg"}
      opened={opened}
      onClose={closeModal}
      title="Manage connections"
    >
      <Stack gap={"sm"}>
        <Group justify="center">
          <Text>List of Filey servers</Text>
        </Group>

        <Text>Auto refresh in {seconds}s</Text>

        <Button
          variant="light"
          color="lime"
          mx="0"
          justify="space-between"
          onClick={() => {
            setConnectedTo({
              address: "This machine",
              osType: osInfo,
            });
            closeModal();
          }}
          leftSection={<OsIcon os={osInfo} />}
          rightSection={<IconCircleArrowRightFilled />}
        >
          <Text>{printLocalMachineName(osInfo, hasBattery)}</Text>
        </Button>
        {peers.map(({ address, osType }) => (
          <Button
            key={address + " " + osType}
            variant="light"
            color="lime"
            onClick={() => {
              setConnectedTo({ address, osType });
              closeModal();
            }}
            mx="0"
            justify="space-between"
            leftSection={<OsIcon os={osType} />}
            rightSection={<IconCircleArrowRightFilled />}
          >
            <Text>{address}</Text>
          </Button>
        ))}
      </Stack>
    </Modal>
  );
};
