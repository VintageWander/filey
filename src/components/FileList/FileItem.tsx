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
  CopyButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAtom } from "jotai";
import ReactPlayer from "react-player";
import { FileIcon } from "@/components/FileList/FileIcon";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { FiCheck, FiCopy, FiEye, FiEyeOff } from "react-icons/fi";
import { FaDownload, FaFolder, FaTrashAlt } from "react-icons/fa";
import { MdFileOpen } from "react-icons/md";
import { Tooltip } from "@/components/ToolTip";

export const FileItem = ({
  file: { id, name, path, visibility },
}: {
  file: FileModel;
}) => {
  // ------------------------------ State --------------------------------

  const theme = useMantineTheme();
  const [files, setFiles] = useAtom(filesAtom);
  const [connectedTo] = useAtom(connectedToAtom);
  const [isLocal] = useAtom(isLocalAtom);
  const [isExternal] = useAtom(isExternalAtom);

  const [isDesktop] = useAtom(isDesktopAtom);
  const extension = name.split(".").pop()!;

  const [
    previewModalOpened,
    { open: openPreviewModal, close: closePreviewModal },
  ] = useDisclosure(false);

  // ------------------------------ Render --------------------------------

  return (
    <>
      {
        /* Image preview modal */
        isExternal && isDesktop && (
          <Modal
            size="100%"
            opened={previewModalOpened}
            onClose={closePreviewModal}
            title="Preview"
            centered
          >
            {["gif", "png", "jpg", "jpeg", "svg", "webp"].includes(
              extension
            ) ? (
              <Image
                src={`http://${connectedTo}:38899/files/${id}`}
                alt={name}
                width={"100%"}
              />
            ) : extension === "mp4" ? (
              <ReactPlayer
                url={`http://${connectedTo}:38899/files/${id}`}
                controls
                width={"100%"}
                playsinline
              />
            ) : (
              <Text>Cannot render video</Text>
            )}
          </Modal>
        )
      }
      {/* File item */}
      <Paper w="100%" withBorder p="xs">
        <Stack gap={"xs"}>
          <Group>
            <FileIcon extension={extension} />
            <Text w="86%" lineClamp={1}>
              {name}
            </Text>
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
                    let modifiedFiles: FileModel[] = files.map((file) => {
                      if (file.id === id) {
                        file.visibility =
                          visibility === "public" ? "private" : "public";
                      }
                      return file;
                    });

                    setFiles(modifiedFiles);
                    invoke("upsert_files", { files: modifiedFiles }).catch(
                      error
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
                <Tooltip
                  label={
                    <Text size="sm" lineClamp={2}>
                      {path}
                    </Text>
                  }
                >
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
              )
            }

            {
              /* Copy link button */
              isExternal && (
                <CopyButton
                  value={`http://${connectedTo}:38899/files/${id}`}
                  timeout={1500}
                >
                  {({ copied, copy }) => (
                    <Button
                      px="10px"
                      color={copied ? "teal" : "cyan"}
                      variant="subtle"
                      onClick={copy}
                      leftSection={copied ? <FiCheck /> : <FiCopy />}
                    >
                      Copy link
                    </Button>
                  )}
                </CopyButton>
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
                    ].includes(extension) && isDesktop
                      ? openPreviewModal()
                      : openUrl(`http://${connectedTo}:38899/files/${id}`);
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
                    `http://${connectedTo}:38899/files/${id}?mode=download`
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
