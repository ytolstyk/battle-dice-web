import { useState } from "react";
import BarcodeScanner from "react-qr-barcode-scanner";
import { useNavigate } from "react-router-dom";
import { regexTester, ROOM_ID_LENGTH } from "../helpers/idGenerator";
import { Box, Center, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import styles from "./qtScanner.module.css";

export function JoinRoomModal() {
  const [qrData, setQrData] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  if (regexTester.test(qrData)) {
    const match = qrData.match(regexTester);

    if (!match) return null;

    const path = match[0];

    navigate(path);
    modals.closeAll();
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRoomId(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (`/rooms/${roomId}`.match(regexTester)) {
      navigate(`/rooms/${roomId}`);
      modals.closeAll();
    }
  };

  return (
    <>
      <Center mb="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            size="lg"
            value={roomId}
            onChange={handleInputChange}
            placeholder="Room ID"
            maxLength={ROOM_ID_LENGTH}
            ta="center"
          />
        </form>
      </Center>
      <Text ta="center" mb="sm">
        Or scan a QR code to join a room
      </Text>
      <Box m="lg">
        <Box className={styles["qr-scanner-container"]}>
          <BarcodeScanner
            onUpdate={(_, result) => {
              if (result) {
                setQrData(result.getText());
              } else {
                setQrData("");
              }
            }}
          />
        </Box>
      </Box>
    </>
  );
}
