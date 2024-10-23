import { Button, Text, Group, Loader, Stack } from "@mantine/core";
import { useAtom } from "jotai";
import { FaFileImport, FaArrowsRotate } from "react-icons/fa6";
import { connectedToAtom, filesAtom, isLocalAtom } from "@/store";
import { useEffect, useState } from "react";
import { useInterval } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { FileModel, FileResponse } from "@/models";
import { v4 as UuidV4 } from "uuid";
import { FileItem } from "./FileItem";

export const FileList = () => {
  const [files, setFiles] = useAtom(filesAtom);
  const [databaseReady, setDatabaseReady] = useState<boolean>(false);

  const [connectedTo, setConnectedTo] = useAtom(connectedToAtom);
  const [isLocal] = useAtom(isLocalAtom);

  const databaseCheckInterval = useInterval(() => {
    invoke<boolean>("database_ready").then(setDatabaseReady).catch(error);
  }, 1000);

  const refreshInterval = useInterval(() => refresh(), 2000);

  useEffect(() => {
    invoke<boolean>("database_ready").then(setDatabaseReady).catch(error);
  }, []);

  useEffect(() => {
    if (!databaseReady) {
      const { start, stop } = databaseCheckInterval;
      start();
      return stop;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [connectedTo]);

  useEffect(() => {
    const { start, stop } = refreshInterval;
    start();
    return stop;
  }, [connectedTo]);

  // Adding new files to the file list
  // Using tauri's file picker to get file paths
  const addFiles = async () => {
    const paths: string[] | null = await openFileDialog({
      multiple: true,
      directory: false,
    });
    if (!paths) return;

    // Convert the added file paths into FileModel
    const inputFiles: FileModel[] = paths.map((path) => {
      return {
        id: UuidV4(),
        name: path.split("/").pop(),
        visibility: "private",
        path,
      } as FileModel;
    });

    // Merge 2 arrays
    const mergedFiles = [...files, ...inputFiles];
    // Get the paths of 2 arrays
    const allPaths: string[] = mergedFiles.map((file) => file.path);

    // Makes sure that each file has an unique path
    const uniqueFiles: FileModel[] = mergedFiles.filter(
      (file, index) => !allPaths.includes(file.path, index + 1)
    );

    // Invoke the upsert function in Rust,
    // On the Rust side, it will do a "insert on conflict do update" type query to the SQLite database
    invoke<FileModel[]>("upsert_files", { files: uniqueFiles })
      .then(setFiles)
      .catch(error);
  };

  const refresh = async () => {
    try {
      if (isLocal) {
        let dbFiles = await invoke<FileModel[]>("get_files");

        if (dbFiles.length) {
          dbFiles.forEach(({ id, path }) => {
            invoke("exists", { path }).catch(() => {
              invoke("delete_file", { id });
              setFiles(dbFiles.filter((file) => file.id !== id));
            });
          });
        }
        setFiles(dbFiles);
      } else {
        let externalFiles = await invoke<FileResponse[]>(
          "get_files_from_peer",
          {
            ip: connectedTo,
          }
        );

        setFiles(
          externalFiles.map(({ id, name }) => {
            return {
              id,
              name,
              visibility: "public",
              path: "Unknown",
            } as FileModel;
          })
        );
      }
    } catch (err: any) {
      error(err);
      setConnectedTo("This machine");
    }
  };

  return (
    <>
      {/* Horizontal group */}

      {/* Import file button - triggers addFiles function */}
      <Group justify="space-between">
        <Button
          color="lime"
          disabled={!databaseReady || !isLocal}
          leftSection={<FaFileImport />}
          onClick={() => addFiles().catch(error)}
        >
          Import file
        </Button>

        {
          /* 
            Refresh button, only available when the database is ready 
            Triggers a files refetch
          */
          databaseReady && (
            <Button
              variant="subtle"
              leftSection={<FaArrowsRotate />}
              onClick={refresh}
            >
              Refresh
            </Button>
          )
        }

        {/* File list, if the database is not ready, shows loading spinner */}
        <Stack w="100%" h="50vh" justify="flex-start" align="center" mt="xs">
          {databaseReady ? (
            files.map((file) => <FileItem key={file.id} file={file} />)
          ) : (
            <>
              <Loader color="lime" size="xl" />
              <Text c="gray">Loading the database</Text>
            </>
          )}
        </Stack>
      </Group>
    </>
  );
};
