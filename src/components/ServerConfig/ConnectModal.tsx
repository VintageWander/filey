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
import { connectedToAtom, hostOsAtom, localIpsAtom, peersAtom } from "@/store";
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
  const [peers, setPeers] = useAtom<Peer[]>(peersAtom);
  const [, setLocalIps] = useAtom(localIpsAtom);

  const [existsBattery, setExistsBattery] = useState<boolean>(true);

  const [seconds, setSeconds] = useState<number>(5);

  // -------------------------- Utils ----------------------------------

  // Refresh function
  const refresh = () => {
    // Ask Tauri layer to get a list of local ip addresses
    invoke<string[]>("local_ips")
      // If Tauri resolves and return a list
      .then((dbLocalIp) => {
        // Set scanned peers to empty because we're refreshing
        setPeers([]);
        // Set the local ip addresses list to atom state
        setLocalIps(dbLocalIp);
        // For each of the local ip address
        dbLocalIp.forEach((ip) => {
          const splitIp = ip.split("."); // 192.168.1.10 -> [192, 168, 1, 10]
          const originalEndIp = Number(splitIp.pop()); // 10
          const baseIp = splitIp.join("."); // 192.168.1
          // Looping from 192.168.1.1 -> 192.168.1.255
          for (let endIp = 1; endIp <= 255; ++endIp) {
            /*
              Make a query to http://192.168.1.x:38899/info to get information on every interation of the loop,
              exclude the case of x equals to originalEndIp to prevent self connecting
            */
            if (originalEndIp != endIp) {
              invoke<Peer>("check_peer", {
                ip: `${baseIp}.${endIp}`,
              })
                // If query success, add to the list of peers
                .then((peer) => {
                  setPeers([...peers, peer]);
                })
                // Just ignores if query failed
                // I must add this or else dev console will scream Unhandled Promise exception
                .catch(() => {});
            }
          }
        });
      })
      // There could be a case when the interface cannot call Tauri's command,
      // chances are low but never zero
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
