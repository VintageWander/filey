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

import { Modal, Stack } from "@mantine/core";
import { CopyButton } from "./CopyButton";
import QrCode from "react-qr-code";

// Shows QR code and copy link
export const QrCodeModal = ({
  url,
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
  url: string;
}) => {
  return (
    <Modal title="Shareable QR code" opened={opened} onClose={onClose}>
      <Stack justify="center" align="center">
        <QrCode style={{ padding: "15px", background: "white" }} value={url} />
        <CopyButton url={url} title={url} />
      </Stack>
    </Modal>
  );
};
