import { Flex, Paper, Text } from "@mantine/core";
import type { User } from "./types";
import {
  IconDice6,
  IconDice5,
  IconDice4,
  IconDice3,
  IconDice2,
  IconDice1,
  IconLaurelWreath,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

type Props = {
  player: User;
  isWinner: boolean;
};

const ICON_MAP = [
  IconDice1,
  IconDice2,
  IconDice3,
  IconDice4,
  IconDice5,
  IconDice6,
];

export function OpponentTray({ player, isWinner }: Props) {
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
        <Text>{text}</Text>
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

  return (
    <Paper withBorder shadow="md" p="md" mih="10rem">
      <Flex align="center" mb="md">
        <Text size="xl" fw="bold" inline mr="md">
          {player.name}
        </Text>
        {renderRollIcon()}
        {winnerIcon}
      </Flex>
      {renderResult()}
    </Paper>
  );
}
