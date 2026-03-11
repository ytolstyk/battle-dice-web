import { ActionIcon, Box, Flex, Paper, Text } from "@mantine/core";
import type { DiceResult, User } from "./types";
import {
  IconLaurelWreath,
  IconSquareCheck,
  IconSquareX,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

type Props = {
  player: User;
  isWinner: boolean;
  isOwner: boolean;
  diceRules?: string;
  onApproveReroll: () => void;
  onDeclineReroll: () => void;
  onAnimationComplete?: () => void;
};

function parseDiceTypes(diceRules?: string): string[] {
  if (!diceRules) return ["d6", "d6"];
  const matches = [...diceRules.matchAll(/(\d+)d(\d+)/gi)];
  if (matches.length === 0) return ["d6", "d6"];
  const types: string[] = [];
  for (const m of matches) {
    const count = parseInt(m[1]);
    const face = m[2];
    for (let i = 0; i < count; i++) types.push(`d${face}`);
  }
  return types;
}

function DieBox({
  dieType,
  value,
}: {
  dieType: string;
  value: number | string;
}) {
  return (
    <Box
      style={{
        border: `2px solid var(--mantine-color-${typeof value === "number" ? "blue" : "gray"}-filled)`,
        borderRadius: 8,
        padding: "4px 10px",
        minWidth: "3.2rem",
        textAlign: "center",
      }}
    >
      <Text size="xs" c="dimmed">
        {dieType}
      </Text>
      <Text fw="bold" size="lg">
        {value}
      </Text>
    </Box>
  );
}

function LoadingDie({ dieType }: { dieType: string }) {
  const sides = parseInt(dieType.replace("d", "")) || 6;
  const [displayValue, setDisplayValue] = useState(
    () => Math.floor(Math.random() * sides) + 1,
  );

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    function tick() {
      setDisplayValue(Math.floor(Math.random() * sides) + 1);
      timeoutId = setTimeout(tick, 80 + Math.random() * 140);
    }
    timeoutId = setTimeout(tick, 80 + Math.random() * 140);
    return () => clearTimeout(timeoutId);
  }, [sides]);

  return <DieBox dieType={dieType} value={displayValue} />;
}

function StaticDiceResults({ diceResults }: { diceResults: DiceResult[] }) {
  return (
    <Flex wrap="wrap" gap="xs" p="xs">
      {diceResults.map((result, i) => (
        <DieBox key={i} dieType={result.dieType} value={result.value} />
      ))}
    </Flex>
  );
}

type Phase = "idle" | "done";

export function OpponentTray({
  player,
  isWinner,
  isOwner,
  diceRules,
  onApproveReroll,
  onDeclineReroll,
  onAnimationComplete,
}: Props) {
  const hasResults = !!(player.roll.total && player.roll.diceResults.length > 0);
  const paperRef = useRef<HTMLDivElement>(null);
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  onAnimationCompleteRef.current = onAnimationComplete;

  const [phase, setPhase] = useState<Phase>(() => (hasResults ? "done" : "idle"));
  const prevStatusRef = useRef(player.status);

  // On mount: if results already exist (page refresh), notify immediately
  useEffect(() => {
    if (hasResults) onAnimationCompleteRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = player.status;

    if (player.status === "rolling") {
      setPhase("idle");
    } else if (player.status === "hasRolled" && prev === "rolling") {
      setPhase("done");
      onAnimationCompleteRef.current?.();
    } else if (player.status === "connected") {
      setPhase("idle");
    }
  }, [player.status]);

  useEffect(() => {
    if (!isWinner || !paperRef.current) return;
    const rect = paperRef.current.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    const end = Date.now() + 3000;
    const frame = () => {
      confetti({
        particleCount: 4,
        spread: 60,
        origin: { x, y },
        startVelocity: 20,
        ticks: 80,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [isWinner]);

  function renderDiceArea() {
    if (player.status === "rolling" && phase === "idle") {
      const dieTypes = parseDiceTypes(diceRules);
      return (
        <Flex wrap="wrap" gap="xs" p="xs">
          {dieTypes.map((dieType, i) => (
            <LoadingDie key={i} dieType={dieType} />
          ))}
        </Flex>
      );
    }

    if (phase === "done" && hasResults) {
      return (
        <Flex direction="column" flex={1} style={{ overflowY: "auto" }}>
          <Flex direction="column" px="xs" pt="xs">
            {player.roll.modDescription && (
              <Text size="xs" c="dimmed">
                {player.roll.modDescription}
              </Text>
            )}
            <Text fw="bold">Result: {player.roll.total}</Text>
          </Flex>
          <StaticDiceResults diceResults={player.roll.diceResults} />
        </Flex>
      );
    }

    return null;
  }

  const winnerIcon = isWinner ? (
    <IconLaurelWreath size={24} color="var(--mantine-color-blue-filled)" />
  ) : null;

  const rerollRequest =
    isOwner && player.status === "requestedReroll" ? (
      <Flex direction="column" align="flex-end" gap={2}>
        <Text size="xs" c="dimmed">
          Approve reroll?
        </Text>
        <Flex gap={4}>
          <ActionIcon
            color="green"
            variant="subtle"
            size="sm"
            onClick={onApproveReroll}
          >
            <IconSquareCheck size={18} />
          </ActionIcon>
          <ActionIcon
            color="red"
            variant="subtle"
            size="sm"
            onClick={onDeclineReroll}
          >
            <IconSquareX size={18} />
          </ActionIcon>
        </Flex>
      </Flex>
    ) : null;

  return (
    <Paper ref={paperRef} withBorder shadow="md" p="md" h="100%">
      <Flex
        p="xs"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--mantine-color-body) 50%, transparent)",
          borderRadius: "var(--mantine-radius-sm)",
        }}
        direction="column"
        h="100%"
      >
        <Flex align="center" mb={phase !== "idle" ? "xs" : 0}>
          <Text size="xl" fw="bold" inline mr="xs">
            {player.name}
          </Text>
          {winnerIcon}
          <Flex flex={1} />
          {rerollRequest}
        </Flex>
        {renderDiceArea()}
      </Flex>
    </Paper>
  );
}
