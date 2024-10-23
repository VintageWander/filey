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

import { Peer } from "@/models";
import { connectedToAtom, hostOsAtom, localIpsAtom } from "@/store";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { Text, Group, Modal, Stack, Button } from "@mantine/core";
import { OsIcon } from "../OsIcon";
import { FaArrowAltCircleRight } from "react-icons/fa";
import { printLocalMachineName } from "@/utils";

export const ConnectModal = ({
  opened,
  closeModal,
}: {
  opened: boolean;
  closeModal: () => void;
}) => {
  // ----------------------------- State ------------------------------------

  const [, setConnectedTo] = useAtom(connectedToAtom);
  const [hostOs] = useAtom(hostOsAtom);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [, setLocalIps] = useAtom(localIpsAtom);

  const [existsBattery, setExistsBattery] = useState<boolean>(true);

  const [seconds, setSeconds] = useState<number>(5);

  // -------------------------- Utils ----------------------------------

  const refresh = () => {
    invoke<string[]>("local_ips")
      .then((dbLocalIp) => {
        setPeers([]);
        setLocalIps(dbLocalIp);
        dbLocalIp.forEach((ip) => {
          // 192.168.1.10 -> [192, 168, 1, 10]
          let splitIp = ip.split(".");
          // 10
          let originalEndIp = Number(splitIp.pop());
          // 192.168.1
          let baseIp = splitIp.join(".");
          // 192.168.1.1 -> 192.168.1.255
          for (let endIp = 1; endIp <= 255; ++endIp) {
            if (originalEndIp != endIp) {
              invoke<Peer>("check_peer", {
                ip: `${baseIp}.${endIp}`,
              })
                .then((peer) => {
                  setPeers([...peers, peer]);
                })
                .catch(() => {});
            }
          }
        });
        console.log(peers);
      })
      .catch(error);
  };

  // ---------------------------- Effects ----------------------------------

  // Initial load
  useEffect(() => {
    invoke<boolean>("check_battery").then(setExistsBattery).catch(error);
    refresh();
  }, []);

  // Reloading the second counter
  useEffect(() => {
    const intervalId = setInterval(() => {
      setSeconds(seconds > 0 ? seconds - 1 : 5);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [seconds]);

  // Refreshes every 6 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      refresh();
    }, 6000);
    return () => clearInterval(intervalId);
  }, []);

  // ------------------------------ Render --------------------------------

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
            setConnectedTo("This machine");
            closeModal();
          }}
          leftSection={<OsIcon os={hostOs} />}
          rightSection={<FaArrowAltCircleRight />}
        >
          <Text>{printLocalMachineName(hostOs, existsBattery)}</Text>
        </Button>
        {peers.map(({ address, osType }) => (
          <Button
            key={address}
            variant="light"
            color="lime"
            onClick={() => {
              setConnectedTo(address);
              closeModal();
            }}
            mx="0"
            justify="space-between"
            leftSection={<OsIcon os={osType} />}
            rightSection={<FaArrowAltCircleRight />}
          >
            <Text>{address}</Text>
          </Button>
        ))}
      </Stack>
    </Modal>
  );
};
