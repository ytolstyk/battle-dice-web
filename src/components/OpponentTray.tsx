import { ActionIcon, Box, Flex, Paper, Text } from "@mantine/core";
import type { User } from "./types";
import {
  IconDice6,
  IconDice5,
  IconDice4,
  IconDice3,
  IconDice2,
  IconDice1,
  IconLaurelWreath,
  IconSquareCheck,
  IconSquareX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

type Props = {
  player: User;
  isWinner: boolean;
  isOwner: boolean;
  onApproveReroll: () => void;
  onDeclineReroll: () => void;
};

const ICON_MAP = [
  IconDice1,
  IconDice2,
  IconDice3,
  IconDice4,
  IconDice5,
  IconDice6,
];

export function OpponentTray({ player, isWinner, isOwner, onApproveReroll, onDeclineReroll }: Props) {
  const [iconIndex, setIconIndex] = useState(0);
  const hasResults = player.roll.total && player.roll.diceResults.length > 0;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (player.status === "rolling") {
      interval = setInterval(() => {
        setIconIndex((prev) => (prev + 1) % ICON_MAP.length);
      }, 300);
    }

    return () => {
      clearInterval(interval);
    };
  }, [player.status]);

  function renderResult() {
    if (!hasResults) {
      return null;
    }

    const text = player.roll.diceResults
      .map((res) => {
        return `${res.dieType}: ${res.value}`;
      })
      .join(", ");

    return (
      <>
        <Text style={{ maxHeight: "4rem", overflowY: "auto" }}>{text}</Text>
        <Text fw="bold">Result: {player.roll.total}</Text>
      </>
    );
  }

  function renderRollIcon() {
    if (player.status !== "rolling") {
      return null;
    }

    const Icon = ICON_MAP[iconIndex];

    return <Icon size={24} color="var(--mantine-color-blue-filled)" />;
  }

  const winnerIcon = isWinner ? (
    <IconLaurelWreath size={24} color="var(--mantine-color-blue-filled)" />
  ) : null;

  const rerollRequest = isOwner && player.status === "requestedReroll" ? (
    <Flex direction="column" align="flex-end" gap={2}>
      <Text size="xs" c="dimmed">Approve reroll?</Text>
      <Flex gap={4}>
        <ActionIcon color="green" variant="subtle" size="sm" onClick={onApproveReroll}>
          <IconSquareCheck size={18} />
        </ActionIcon>
        <ActionIcon color="red" variant="subtle" size="sm" onClick={onDeclineReroll}>
          <IconSquareX size={18} />
        </ActionIcon>
      </Flex>
    </Flex>
  ) : null;

  return (
    <Paper withBorder shadow="md" p="md" mih="10rem">
      <Box
        p="xs"
        mb="xs"
        style={{
          backgroundColor: "color-mix(in srgb, var(--mantine-color-body) 50%, transparent)",
          borderRadius: "var(--mantine-radius-sm)",
        }}
      >
        <Flex align="center" mb={hasResults ? "xs" : 0}>
          <Text size="xl" fw="bold" inline mr="xs">
            {player.name}
          </Text>
          {winnerIcon}
          <Flex flex={1} />
          {renderRollIcon()}
          {rerollRequest}
        </Flex>
        {renderResult()}
      </Box>
    </Paper>
  );
}
