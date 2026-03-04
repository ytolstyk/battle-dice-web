import { useState, useRef, useEffect } from "react";
import BarcodeScanner from "react-qr-barcode-scanner";
import { useNavigate } from "react-router-dom";
import { regexTester, ROOM_ID_LENGTH } from "../helpers/idGenerator";
import { Box, Center, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import styles from "./qtScanner.module.css";

export function JoinRoomModal() {
  const [qrData, setQrData] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isFrozen, setIsFrozen] = useState(false);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const match = qrData.match(regexTester);
    if (!match) return;

    const path = match[0];

    const timer = setTimeout(() => {
      setIsFrozen(true);
      navigate(path);
      modals.closeAll();
    }, 500);

    return () => clearTimeout(timer);
  }, [qrData, navigate]);

  useEffect(() => {
    if (isFrozen && scannerContainerRef.current) {
      const video = scannerContainerRef.current.querySelector("video");
      video?.pause();
    }
  }, [isFrozen]);

  const checkAndNavigate = (value: string) => {
    if (`/rooms/${value}`.match(regexTester)) {
      navigate(`/rooms/${value}`);
      modals.closeAll();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setRoomId(value);
    checkAndNavigate(value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    checkAndNavigate(roomId);
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
        Scan the QR code to join a room
      </Text>
      <Box m="lg">
        <Box
          ref={scannerContainerRef}
          className={`${styles["qr-scanner-container"]} ${isFrozen ? styles.frozen : ""}`}
        >
          <BarcodeScanner
            onUpdate={(_, result) => {
              if (!isFrozen) {
                if (result) {
                  setQrData(result.getText());
                } else {
                  setQrData("");
                }
              }
            }}
          />
        </Box>
      </Box>
    </>
  );
}
