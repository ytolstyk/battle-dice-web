import {
  Text,
  Center,
  Divider,
  Paper,
  Title,
  Box,
  Flex,
  TextInput,
} from "@mantine/core";
import { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import { useNavigate } from "react-router-dom";
import { generateRoomId } from "../helpers/idGenerator";
import { modals } from "@mantine/modals";
import { JoinRoomModal } from "./JoinRoomModal";

export function Home() {
  const { userName, saveUserName } = useContext(UserContext);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleCreateRoomClick = () => {
    if (!userName) {
      setErrors({ name: "Please enter your name before creating a room." });
      return;
    }

    const newRoomId = generateRoomId();
    navigate(`/rooms/${newRoomId}?new=true`);
  };

  const handleJoinRoomClick = () => {
    if (!userName) {
      setErrors({ name: "Please enter your name before joining a room." });
      return;
    }

    modals.open({
      title: "Join Room",
      size: "lg",
      children: <JoinRoomModal />,
    });
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrors((prev) => ({ ...prev, name: "" }));

    saveUserName(event.target.value);
  };

  return (
    <Center>
      <Flex direction="column" align="center" gap="xl" mt="lg">
        <div>
          <Title ta="center" mb="lg">
            Welcome {userName ? `${userName} ` : ""}to The Battlefield!
          </Title>
          <Center>
            <TextInput
              placeholder="Your Name"
              value={userName}
              onChange={handleNameChange}
              style={{ maxWidth: 200 }}
              error={errors.name}
              ta="center"
            />
          </Center>
        </div>
        <Paper p="md" withBorder>
          <Box
            p="md"
            onClick={handleCreateRoomClick}
            style={{ cursor: "pointer" }}
          >
            <Title mb="lg">Create Room</Title>
            <Text>Create a space to invite your opponents.</Text>
          </Box>
          <Divider />
          <Box
            p="md"
            onClick={handleJoinRoomClick}
            style={{ cursor: "pointer" }}
          >
            <Title mb="lg">Join Room</Title>
            <Text>
              Click here if you've been challenged and given a code. Good luck.
            </Text>
          </Box>
        </Paper>
      </Flex>
    </Center>
  );
}
