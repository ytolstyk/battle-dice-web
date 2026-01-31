import { useParams } from "react-router-dom";
import { DiceTray } from "./DiceTray";
import { useContext, useEffect, useState } from "react";
import { OpponentTray } from "./OpponentTray";
import {
  Box,
  Button,
  Center,
  Flex,
  Grid,
  Paper,
  Popover,
  SimpleGrid,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import { modals } from "@mantine/modals";
import { ShareRoomModal } from "./ShareRoomModal";
import { useDiceWebSocket } from "../hooks/useDiceWebSocket";
import { IconInfoSquareRounded, IconShare } from "@tabler/icons-react";
import { useThrottle } from "@custom-react-hooks/use-throttle";
import type { RollResult } from "./types";
import { parseDiceBoxResults } from "../helpers/resultsParser";
import styles from "./diceTray.module.css";
import { UserContext } from "./UserContext";
import { AddUserName } from "./AddUserName";

export function Room() {
  const { roomId } = useParams();
  const { userId, userName } = useContext(UserContext);
  const [diceCombination, setDiceCombination] = useState("4d6");
  const throttledDiceCombination = useThrottle(diceCombination, 1000);
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    isConnected,
    room,
    roomUser,
    winners,
    joinRoom,
    leaveRoom,
    updateDiceRules,
    updateUserRollResult,
    updateUserName,
    rollDice,
  } = useDiceWebSocket();

  useEffect(() => {
    if (roomId && isConnected) {
      joinRoom(roomId);
    }

    return () => {
      if (roomId) {
        leaveRoom(roomId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, roomId]);

  useEffect(() => {
    const isNewRoom = searchParams.get("new") === "true";

    if (isNewRoom && roomId) {
      modals.open({
        title: "Invite Others",
        children: <ShareRoomModal roomId={roomId} />,
        size: "lg",
      });

      searchParams.delete("new");
      setSearchParams(searchParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userName && roomId) {
      modals.open({
        title: "Enter your name",
        children: (
          <AddUserName updateUserName={updateUserName} roomId={roomId} />
        ),
        size: "md",
      });
    }
  }, [roomId, userName, updateUserName]);

  useEffect(() => {
    if (roomId && throttledDiceCombination) {
      updateDiceRules(roomId, throttledDiceCombination);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, throttledDiceCombination]);

  const handleDiceCombinationChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDiceCombination(event.target.value);
  };

  const handleShareClick = () => {
    if (roomId) {
      modals.open({
        title: "Invite Others",
        children: <ShareRoomModal roomId={roomId} />,
        size: "lg",
      });
    }
  };

  const handleRollDice = () => {
    if (roomId) {
      rollDice(roomId);
    }
  };

  const handleRollDiceResult = (results: RollResult[]) => {
    if (roomId) {
      updateUserRollResult(roomId, parseDiceBoxResults(results));
    }
  };

  function renderDiceTrays() {
    if (!room || room.participants.length < 2) {
      return (
        <Center>
          <Paper
            withBorder
            shadow="md"
            h="100%"
            className={styles.inviteOpponentsWrapper}
          >
            <Center>
              <Box p="xl">
                <Text ta="center" mb="md">
                  Invite opponents to start battling
                </Text>
                <Center>
                  <Button onClick={handleShareClick}>Invite</Button>
                </Center>
              </Box>
            </Center>
          </Paper>
        </Center>
      );
    }

    const trays = [];

    for (let i = 0; i < room.participants.length; i++) {
      const player = room.participants[i];

      if (player.id === userId) {
        continue;
      }

      const isWinner = winners.map((u) => u.id).includes(player.id);

      trays.push(
        <Grid.Col key={player.id} span={{ base: 6, sm: 6, md: 4, lg: 3 }}>
          <OpponentTray player={player} isWinner={isWinner} />
        </Grid.Col>,
      );
    }

    return <Grid justify="center">{trays}</Grid>;
  }

  function renderDiceRules() {
    if (room?.ownerId !== userId) {
      return <Text>Current roll: {room?.diceRules}</Text>;
    }

    return (
      <>
        <TextInput
          w={240}
          type="text"
          placeholder="Dice rules"
          value={diceCombination}
          onChange={handleDiceCombinationChange}
          mr="sm"
          styles={{ input: { textAlign: "center" } }}
        />
        <Popover width={200} position="bottom" withArrow shadow="md">
          <Popover.Target>
            <IconInfoSquareRounded size={20} style={{ cursor: "pointer" }} />
          </Popover.Target>
          <Popover.Dropdown>
            <Text size="xs">
              Describe the dice you want to roll. For instance, to roll 2d4 with
              1d8, write "2d4 + 1d8" in the text box.
            </Text>
          </Popover.Dropdown>
        </Popover>
      </>
    );
  }

  const isWinner = winners.map((u) => u.id).includes(userId);

  return (
    <>
      <Flex align="center" justify="center">
        <Title order={2} ta="center" mr="sm">
          Room {roomId}{" "}
        </Title>
        <UnstyledButton onClick={handleShareClick} display="flex">
          <IconShare
            size={30}
            stroke={2}
            color="var(--mantine-color-blue-filled)"
          />
        </UnstyledButton>
      </Flex>
      <Center mt="sm" mb="sm">
        {renderDiceRules()}
      </Center>
      <SimpleGrid cols={1}>
        <Box>{renderDiceTrays()}</Box>
        <Box h="40vh">
          <DiceTray
            diceCombination={room?.diceRules}
            isWinner={isWinner}
            roomUser={roomUser}
            onRollDice={handleRollDice}
            onRollDiceResult={handleRollDiceResult}
          />
        </Box>
      </SimpleGrid>
    </>
  );
}
