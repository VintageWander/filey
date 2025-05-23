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
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { QrCodeModal } from "@/components/ui/QrCodeModal";
import {
  connectedToAtom,
  isDesktopAtom,
  isFileyExternalAtom,
  isFileyLocalAtom,
  isServerOnlineAtom,
  localIpsAtom,
} from "@/features/server/store";
import { filesAtom } from "../store";
import { FileModel } from "../types";
import {
  IconDownload,
  IconEye,
  IconEyeOff,
  IconFolderSearch,
  IconPhoto,
  IconQrcode,
  IconTrash,
} from "@tabler/icons-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { FileIcon } from "@/components/icons/FileIcon";
import { Tooltip } from "@/components/ui/Tooltip";

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

  const [isFileyLocal] = useAtom(isFileyLocalAtom);
  const [isFileyExternal] = useAtom(isFileyExternalAtom);

  const [isServerOnline] = useAtom(isServerOnlineAtom);

  const [isDesktop] = useAtom(isDesktopAtom);

  const extension = name.split(".").pop()!;
  const previewable = [
    "gif",
    "png",
    "jpg",
    "jpeg",
    "svg",
    "webp",
    "mp4",
    "mp3",
    "wav",
  ].includes(extension);

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
        isFileyExternal && (
          <Modal
            opened={previewModalOpened}
            onClose={closePreviewModal}
            title="Preview"
            centered
          >
            {["gif", "png", "jpg", "jpeg", "svg", "webp"].includes(
              extension
            ) ? (
              <Image
                width={"100%"}
                src={`http://${connectedTo.address}:38899/files/${id}`}
                alt={name}
              />
            ) : extension === "mp4" ? (
              <video
                width={"100%"}
                src={`http://${connectedTo.address}:38899/files/${id}`}
                controls
                playsInline
                autoPlay
              />
            ) : ["mp3", "wav"].includes(extension) ? (
              <audio
                src={`http://${connectedTo.address}:38899/files/${id}`}
                controls
                playsInline
              />
            ) : (
              <Text>Cannot render content</Text>
            )}
          </Modal>
        )
      }

      {
        /* Qr code preview modal */
        (isServerOnline || isFileyExternal) && (
          <QrCodeModal
            url={
              isFileyLocal
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
              disabled={isServerOnline && visibility === "public"}
              label="Requires server status online and visibility public"
            >
              <Button
                px="3px"
                variant="subtle"
                color="grape"
                disabled={
                  isFileyExternal
                    ? false
                    : !isServerOnline || visibility === "private"
                }
                onClick={openQrCodeModal}
              >
                <IconQrcode size="2em" />
              </Button>
            </Tooltip>
          </Group>
          <Divider />

          {/* Button group */}
          <Group gap="xs" justify="flex-end" align="center">
            {/* Visibility button */}
            {isFileyLocal && (
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

                    setFiles({ type: "upsert", files: modifiedFiles });
                  }}
                  color={visibility === "public" ? "lime" : "gray"}
                  leftSection={
                    visibility === "public" ? <IconEye /> : <IconEyeOff />
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
              isFileyLocal && isDesktop && (
                <Tooltip label={path}>
                  <Button
                    onClick={() => invoke("reveal", { path }).catch(error)}
                    variant="subtle"
                    color={theme.colors.indigo[3]}
                    px="10px"
                    leftSection={
                      <IconFolderSearch color={theme.colors.indigo[3]} />
                    }
                  >
                    Reveal
                  </Button>
                </Tooltip>
              )
            }

            {
              /* Delete button */
              isFileyLocal && (
                <Tooltip label="Remove from file list">
                  <Button
                    variant="subtle"
                    color={theme.colors.red[5]}
                    px="10px"
                    onClick={() => {
                      setFiles({ type: "delete", id });
                    }}
                    leftSection={<IconTrash color={theme.colors.red[5]} />}
                  >
                    Delete
                  </Button>
                </Tooltip>
              )
            }

            {
              /* Copy link button */
              isFileyExternal && (
                <CopyButton
                  url={`http://${connectedTo.address}:38899/files/${id}`}
                  title="Copy"
                />
              )
            }

            {
              /* Preview button */
              isFileyExternal && (
                <Button
                  px="10px"
                  color="indigo"
                  variant="subtle"
                  leftSection={<IconPhoto />}
                  onClick={() => {
                    previewable
                      ? openPreviewModal()
                      : openUrl(
                          `http://${connectedTo.address}:38899/files/${id}`
                        );
                  }}
                >
                  Preview
                </Button>
              )
            }

            {
              /* Download button */
              isFileyExternal && (
                <Button
                  px="10px"
                  color="lime"
                  variant="subtle"
                  leftSection={<IconDownload />}
                  onClick={() =>
                    openUrl(
                      `http://${connectedTo.address}:38899/files/${id}?mode=download`
                    )
                  }
                >
                  Download
                </Button>
              )
            }
          </Group>
        </Stack>
      </Paper>
    </>
  );
};
