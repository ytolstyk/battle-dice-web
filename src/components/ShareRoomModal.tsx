import { Button, Center, CopyButton, Title } from "@mantine/core";
import QRCode from "react-qr-code";

type Props = {
  roomId: string;
};

export function ShareRoomModal({ roomId }: Props) {
  const host = window.location.origin;
  const shareLink = `${host}/rooms/${roomId}`;

  return (
    <div>
      <Title fw="bold" order={1} ta="center">
        {roomId}
      </Title>
      <Center my="lg">
        <QRCode value={shareLink} />
      </Center>
      <Center>
        <CopyButton value={shareLink}>
          {({ copied, copy }) => (
            <Button color={copied ? "teal" : "blue"} onClick={copy}>
              {copied ? "Copied url" : "Copy url"}
            </Button>
          )}
        </CopyButton>
      </Center>
    </div>
  );
}
