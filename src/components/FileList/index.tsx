import { Button, Group } from "@mantine/core";
import { useAtom } from "jotai";
import { FaFileImport, FaArrowsRotate } from "react-icons/fa6";
import { filesAtom, isLocalAtom } from "../../store";
import { useEffect, useState } from "react";
import { useInterval } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";

export const FileList = () => {
  const [files, setFiles] = useAtom(filesAtom);
  const [databaseReady, setDatabaseReady] = useState<boolean>(false);

  const [isLocal] = useAtom(isLocalAtom);

  const databaseCheckInterval = useInterval(() => {
    invoke<boolean>("database_ready").then(setDatabaseReady).catch(error);
  }, 2000);

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

  return (
    <>
      {/* Horizontal group */}

      {/* Import file button - triggers addFiles function */}
      <Group justify="space-between">
        <Button
          color="lime"
          disabled={!databaseReady || !isLocal}
          leftSection={<FaFileImport />}
        >
          Import file
        </Button>
        {/* 
            Refresh button, only available when the database is ready 
            Triggers a files refetch
          */}
        {databaseReady && (
          <Button variant="subtle" leftSection={<FaArrowsRotate />}>
            Refresh
          </Button>
        )}
      </Group>
    </>
  );
};
