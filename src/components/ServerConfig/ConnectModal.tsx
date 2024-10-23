import { Peer } from "@/models";
import { connectedToAtom, hostOsAtom, localIpsAtom } from "@/store";
import { useInterval } from "@mantine/hooks";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { Text, Group, Modal, Stack, Button } from "@mantine/core";
import { OsIcon } from "../OsIcon";
import { FaArrowsRotate } from "react-icons/fa6";
import { FaArrowAltCircleRight } from "react-icons/fa";
import { printLocalMachineName } from "@/utils";

export const ConnectModal = ({
  opened,
  closeModal,
}: {
  opened: boolean;
  closeModal: () => void;
}) => {
  const [, setConnectedTo] = useAtom(connectedToAtom);
  const [hostOs] = useAtom(hostOsAtom);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [, setLocalIps] = useAtom(localIpsAtom);

  const [existsBattery, setExistsBattery] = useState<boolean>(true);

  const refreshInterval = useInterval(() => refresh(), 6000);

  const [seconds, setSeconds] = useState(5);
  const interval = useInterval(
    () => setSeconds((s) => (s > 0 ? s - 1 : 5)),
    1000
  );

  useEffect(() => {
    interval.start();
    return interval.stop;
  }, []);

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
      })
      .catch(error);
  };

  useEffect(() => {
    invoke<boolean>("check_battery").then(setExistsBattery).catch(error);
    refresh();
  }, []);

  // Refreshes every 6 seconds
  useEffect(() => {
    const { start, stop } = refreshInterval;
    start();
    return stop;
  }, []);

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
          rightSection={<FaArrowsRotate />}
        >
          <Text>{printLocalMachineName(existsBattery)}</Text>
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
