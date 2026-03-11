import { useParams } from "react-router-dom";
import { DiceTray } from "./DiceTray";
import { useContext, useEffect, useRef, useState } from "react";
import { OpponentTray } from "./OpponentTray";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Code,
  Divider,
  Flex,
  Group,
  Loader,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import { modals } from "@mantine/modals";
import { ShareRoomModal } from "./ShareRoomModal";
import { useDiceWebSocket } from "../hooks/useDiceWebSocket";
import { IconCheck, IconHelp, IconShare } from "@tabler/icons-react";
import type { Roll } from "./types";
import styles from "./diceTray.module.css";
import { UserContext } from "./UserContext";
import { AddUserName } from "./AddUserName";

export function Room() {
  const { roomId } = useParams();
  const { userId, userName } = useContext(UserContext);
  const [diceCombination, setDiceCombination] = useState("2d6 + 1d8 + 1d12");
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
    rollDice,
    requestReroll,
    approveReroll,
    declineReroll,
    resetRoom,
    updateUserName,
  } = useDiceWebSocket();

  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (roomId && isConnected && userName && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      joinRoom(roomId);
    }

    return () => {
      hasJoinedRef.current = false;
      if (roomId) {
        leaveRoom(roomId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, roomId, userName]);

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
        children: <AddUserName />,
        size: "md",
      });
    }
  }, [roomId, userName]);

  const handleDiceCombinationChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDiceCombination(event.target.value);
  };

  const handleApplyDiceRules = () => {
    if (roomId && diceCombination) {
      updateDiceRules(roomId, diceCombination);
    }
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

  const handleRollDiceResult = (roll: Roll) => {
    if (roomId) {
      updateUserRollResult(roomId, roll);
    }
  };

  const handleRequestReroll = () => {
    if (roomId) {
      requestReroll(roomId);
    }
  };

  const handleResetRoom = () => {
    if (roomId) {
      resetRoom(roomId);
    }
  };

  const handleUpdateUserName = (name: string) => {
    if (roomId) {
      updateUserName(roomId, name);
    }
  };

  function renderDiceTrays() {
    if (!room || room.participants.length < 2) {
      return (
        <Center h="100%">
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
                  <Button disabled={!isConnected} onClick={handleShareClick}>
                    Invite
                  </Button>
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
      const isOwner = room.ownerId === userId;

      trays.push(
        <Box key={player.id} flex={1} maw="20rem" h="100%">
          <OpponentTray
            player={player}
            isWinner={isWinner}
            isOwner={isOwner}
            onApproveReroll={() => roomId && approveReroll(roomId, player.id)}
            onDeclineReroll={() => roomId && declineReroll(roomId, player.id)}
          />
        </Box>,
      );
    }

    return (
      <Flex
        h="100%"
        wrap="nowrap"
        align="center"
        justify="center"
        gap="md"
        p="xs"
      >
        {trays}
      </Flex>
    );
  }

  function handleDiceRulesHelp() {
    modals.open({
      title: "Dice Rules Reference",
      size: "md",
      children: (
        <Stack gap="md" pb="sm">
          <Text size="sm" c="dimmed">
            Uses standard dice notation (Roll20 spec). Basic format:{" "}
            <Code>XdY</Code> — roll <em>X</em> dice with <em>Y</em> sides.
          </Text>

          <Stack gap="xs">
            <Text size="sm" fw={700}>Basics</Text>
            <Divider />
            {[
              ["d20", "One twenty-sided die"],
              ["4d6", "Four six-sided dice, sum all"],
              ["2d4 + 1d8", "Mix dice types with +"],
              ["1d6 + 2", "Add a flat modifier"],
            ].map(([ex, desc]) => (
              <Group key={ex} gap="xs" wrap="nowrap">
                <Code style={{ minWidth: 120 }}>{ex}</Code>
                <Text size="sm" c="dimmed">{desc}</Text>
              </Group>
            ))}
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={700}>Keep / Drop</Text>
            <Divider />
            {[
              ["4d6kh3", "Keep highest 3"],
              ["4d6kl3", "Keep lowest 3"],
              ["4d6k3", "Keep highest 3 (shorthand)"],
              ["4d6dh1", "Drop highest 1"],
              ["4d6dl1", "Drop lowest 1 (shorthand: 4d6d1)"],
            ].map(([ex, desc]) => (
              <Group key={ex} gap="xs" wrap="nowrap">
                <Code style={{ minWidth: 120 }}>{ex}</Code>
                <Text size="sm" c="dimmed">{desc}</Text>
              </Group>
            ))}
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={700}>Reroll</Text>
            <Divider />
            {[
              ["2d8r1", "Reroll any 1s"],
              ["2d8r<3", "Reroll if less than 3"],
              ["2d8r>=7", "Reroll if 7 or higher"],
            ].map(([ex, desc]) => (
              <Group key={ex} gap="xs" wrap="nowrap">
                <Code style={{ minWidth: 120 }}>{ex}</Code>
                <Text size="sm" c="dimmed">{desc}</Text>
              </Group>
            ))}
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={700}>Exploding</Text>
            <Divider />
            {[
              ["3d6!", "Explode on max value (re-roll and add)"],
              ["3d6!>4", "Explode on 4 or higher"],
              ["3d6!3", "Explode only on a 3"],
            ].map(([ex, desc]) => (
              <Group key={ex} gap="xs" wrap="nowrap">
                <Code style={{ minWidth: 120 }}>{ex}</Code>
                <Text size="sm" c="dimmed">{desc}</Text>
              </Group>
            ))}
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={700}>Special</Text>
            <Divider />
            {[
              ["dF", "Fate/Fudge die (−1, 0, or +1)"],
              ["4dF", "Four Fate dice"],
            ].map(([ex, desc]) => (
              <Group key={ex} gap="xs" wrap="nowrap">
                <Code style={{ minWidth: 120 }}>{ex}</Code>
                <Text size="sm" c="dimmed">{desc}</Text>
              </Group>
            ))}
          </Stack>
        </Stack>
      ),
    });
  }

  function renderDiceRules() {
    if (room?.ownerId !== userId) {
      return <Text>Current roll: {room?.diceRules}</Text>;
    }

    return (
      <Group gap="xs" wrap="nowrap">
        <TextInput
          w={180}
          type="text"
          placeholder="Dice rules"
          value={diceCombination}
          onChange={handleDiceCombinationChange}
          styles={{ input: { textAlign: "center" } }}
          disabled={!isConnected}
        />
        <ActionIcon
          variant="filled"
          size="lg"
          radius="xl"
          onClick={handleApplyDiceRules}
          disabled={!isConnected || !diceCombination.trim()}
          aria-label="Apply dice rules"
        >
          <IconCheck size={18} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          radius="xl"
          onClick={handleDiceRulesHelp}
          aria-label="Dice rules help"
        >
          <IconHelp size={20} />
        </ActionIcon>
      </Group>
    );
  }

  const isWinner = winners.map((u) => u.id).includes(userId);

  return (
    <Box
      pos="relative"
      style={{
        height:
          "calc(100dvh - var(--app-shell-header-height) - var(--app-shell-padding) * 2)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <LoadingOverlay
        visible={!isConnected}
        zIndex={99}
        overlayProps={{ radius: "sm", blur: 2 }}
        loaderProps={{
          children: (
            <Flex direction="column" align="center" gap="lg">
              <Loader color="blue" />
              <div>Connecting to the free cluster</div>
            </Flex>
          ),
        }}
      />

      <Box>
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
        <Center mt="sm" mb="sm" h="auto">
          {renderDiceRules()}
        </Center>
      </Box>

      <Flex direction="column" flex={1} style={{ minHeight: 0 }} gap="1rem">
        <Box flex={1} style={{ overflow: "auto", minHeight: 0 }}>
          {renderDiceTrays()}
        </Box>
        <Box flex={1}>
          <DiceTray
            isConnected={isConnected}
            isOwner={room?.ownerId === userId}
            diceCombination={room?.diceRules}
            isWinner={isWinner}
            roomUser={roomUser}
            roomId={roomId}
            onRollDice={handleRollDice}
            onRollDiceResult={handleRollDiceResult}
            onRequestReroll={handleRequestReroll}
            onResetRoom={handleResetRoom}
            onUpdateUserName={handleUpdateUserName}
          />
        </Box>
      </Flex>
    </Box>
  );
}
