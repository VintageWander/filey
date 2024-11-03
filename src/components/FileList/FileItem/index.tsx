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

import { FileModel } from "@/models";
import {
  connectedToAtom,
  filesAtom,
  isDesktopAtom,
  isExternalAtom,
  isLocalAtom,
  isOnlineAtom,
  localIpsAtom,
} from "@/store";
import {
  Modal,
  Image,
  useMantineTheme,
  Paper,
  Stack,
  Group,
  Text,
  Divider,
  Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAtom } from "jotai";
import { FileIcon } from "@/components/FileList/FileItem/FileIcon";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaDownload, FaFolder, FaTrashAlt } from "react-icons/fa";
import { MdFileOpen, MdOutlineQrCode2 } from "react-icons/md";
import { Tooltip } from "@/components/ToolTip";
import { QrCodeModal } from "./QrCodeModal";
import { CopyButton } from "./CopyButton";

export const FileItem = ({
  file: { id, name, path, visibility },
}: {
  file: FileModel;
}) => {
  // ------------------------------ State --------------------------------

  const theme = useMantineTheme();
  const [files, setFiles] = useAtom(filesAtom);
  const [connectedTo] = useAtom(connectedToAtom);
  const [localIps] = useAtom(localIpsAtom);

  const [isLocal] = useAtom(isLocalAtom);
  const [isOnline] = useAtom(isOnlineAtom);
  const [isExternal] = useAtom(isExternalAtom);
  const [isDesktop] = useAtom(isDesktopAtom);

  const extension = name.split(".").pop()!;

  const [
    previewModalOpened,
    { open: openPreviewModal, close: closePreviewModal },
  ] = useDisclosure(false);

  const [
    qrCodeModalOpened,
    { open: openQrCodeModal, close: closeQrCodeModal },
  ] = useDisclosure(false);

  // ------------------------------ Render --------------------------------

  /*
    Notice that on every interaction to get the file, is an http query?
    This is because the file list we keep locally only contains the name and id of the file,
    not the actual file itself. So in order to get the file contents we have to make an http query,
    because downloading every file from an external peer will be costly
  */

  return (
    <>
      {
        /* Image preview modal */
        isExternal && (
          <Modal
            size="100%"
            opened={previewModalOpened}
            onClose={closePreviewModal}
            title="Preview"
            centered
          >
            {["gif", "png", "jpg", "jpeg", "svg", "webp"].includes(
              extension,
            ) ? (
              <Image
                src={`http://${connectedTo.address}:38899/files/${id}`}
                alt={name}
                width={"100%"}
              />
            ) : extension === "mp4" ? (
              <video
                src={`http://${connectedTo.address}:38899/files/${id}`}
                width={"100%"}
                controls
                playsInline
                autoPlay
              />
            ) : (
              <Text>Cannot render video</Text>
            )}
          </Modal>
        )
      }

      {
        /* Qr code preview modal */
        (isOnline || isExternal) && (
          <QrCodeModal
            url={
              isLocal
                ? `http://${localIps[0]}:38899/files/${id}`
                : `http://${connectedTo.address}:38899/files/${id}`
            }
            opened={qrCodeModalOpened}
            onClose={closeQrCodeModal}
          />
        )
      }

      {/* File item */}
      <Paper w="100%" withBorder p="xs">
        <Stack gap={"xs"}>
          {/* File icon, name, QR code button */}
          <Group justify="space-between">
            <Group w="85%">
              {/* File extension icon */}
              <FileIcon extension={extension} />

              {/* File name */}
              <Text w={"80%"} truncate>
                {name}
              </Text>
            </Group>

            {/* Qr code */}
            <Tooltip
              disabled={isOnline && visibility === "public"}
              label="Requires server status online and visibility public"
            >
              <Button
                px="3px"
                variant="subtle"
                color="grape"
                disabled={
                  isExternal ? false : !isOnline || visibility === "private"
                }
                onClick={openQrCodeModal}
              >
                <MdOutlineQrCode2 size="2em" />
              </Button>
            </Tooltip>
          </Group>
          <Divider />

          {/* Button group */}
          <Group gap="xs" justify="flex-end" align="center">
            {/* Visibility button */}
            {isLocal && (
              <Tooltip
                label={`Currently ${visibility} - ${
                  visibility === "public"
                    ? "Everyone can see"
                    : "No one can see"
                }`}
              >
                <Button
                  px="10px"
                  variant={visibility === "public" ? "light" : "subtle"}
                  onClick={() => {
                    const modifiedFiles: FileModel[] = files.map((file) => {
                      if (file.id === id) {
                        file.visibility =
                          visibility === "public" ? "private" : "public";
                      }
                      return file;
                    });

                    setFiles(modifiedFiles);
                    invoke("upsert_files", { files: modifiedFiles }).catch(
                      error,
                    );
                  }}
                  color={visibility === "public" ? "lime" : "gray"}
                  leftSection={
                    visibility === "public" ? <FiEye /> : <FiEyeOff />
                  }
                >
                  {visibility === "public" ? "Public" : "Private"}
                </Button>
              </Tooltip>
            )}

            {
              /*
                Reveal button
                Disable reveal button on mobile since it does not support
              */
              isLocal && isDesktop && (
                <Tooltip label={path}>
                  <Button
                    onClick={() => invoke("reveal", { path }).catch(error)}
                    variant="subtle"
                    color={theme.colors.indigo[3]}
                    px="10px"
                    leftSection={<FaFolder color={theme.colors.indigo[3]} />}
                  >
                    Reveal
                  </Button>
                </Tooltip>
              )
            }

            {
              /* Delete button */
              isLocal && (
                <Tooltip label="Remove from file list">
                  <Button
                    variant="subtle"
                    color={theme.colors.red[5]}
                    px="10px"
                    onClick={() => {
                      invoke("delete_file", { id });
                      setFiles(files.filter((file) => file.id !== id));
                    }}
                    leftSection={<FaTrashAlt color={theme.colors.red[5]} />}
                  >
                    Delete
                  </Button>
                </Tooltip>
              )
            }

            {
              /* Copy link button */
              isExternal && (
                <CopyButton
                  url={`http://${connectedTo.address}:38899/files/${id}`}
                  title="Copy link"
                />
              )
            }

            {
              /* Preview button */
              isExternal && (
                <Button
                  px="10px"
                  color="indigo"
                  variant="subtle"
                  leftSection={<MdFileOpen />}
                  onClick={() => {
                    [
                      "gif",
                      "png",
                      "jpg",
                      "jpeg",
                      "svg",
                      "webp",
                      "mp4",
                    ].includes(extension)
                      ? openPreviewModal()
                      : openUrl(
                          `http://${connectedTo.address}:38899/files/${id}`,
                        );
                  }}
                >
                  Preview
                </Button>
              )
            }

            {isExternal && (
              <Button
                px="10px"
                color="lime"
                variant="subtle"
                leftSection={<FaDownload />}
                onClick={() =>
                  openUrl(
                    `http://${connectedTo.address}:38899/files/${id}?mode=download`,
                  )
                }
              >
                Download
              </Button>
            )}
          </Group>
        </Stack>
      </Paper>
    </>
  );
};
