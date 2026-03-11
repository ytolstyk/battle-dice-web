import { ActionIcon, Flex, Paper, Text } from "@mantine/core";
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

// SVG polygon definitions for each die type (100×100 viewBox)
type DieConfig = {
  points?: string; // polygon points; omit for circle
  circle?: true;   // render as circle instead of polygon
  valueY: number;  // y-coord for the value text
  labelY: number;  // y-coord for the die-type label text
};

const DIE_CONFIGS: Record<string, DieConfig> = {
  // d4 — equilateral triangle pointing up
  d4:  { points: "50,8 88,88 12,88",                                 valueY: 60, labelY: 76 },
  // d6 — square
  d6:  { points: "10,10 90,10 90,90 10,90",                          valueY: 46, labelY: 68 },
  // d8 — regular octagon
  d8:  { points: "50,8 80,20 92,50 80,80 50,92 20,80 8,50 20,20",    valueY: 46, labelY: 65 },
  // d10 — regular pentagon pointing up
  d10: { points: "50,8 90,37 75,84 25,84 10,37",                     valueY: 50, labelY: 68 },
  // d12 — regular pentagon with flat top (rotated 36°)
  d12: { points: "75,16 90,63 50,92 10,63 25,16",                    valueY: 50, labelY: 68 },
  // d20 — regular hexagon
  d20: { points: "50,8 86,29 86,71 50,92 14,71 14,29",               valueY: 50, labelY: 67 },
  // d100 — circle
  d100: { circle: true,                                               valueY: 46, labelY: 65 },
};

const DEFAULT_DIE_CONFIG = DIE_CONFIGS.d6;

function getDieConfig(dieType: string): DieConfig {
  return DIE_CONFIGS[dieType.toLowerCase()] ?? DEFAULT_DIE_CONFIG;
}

function DieShape({
  dieType,
  value,
  settled,
}: {
  dieType: string;
  value: number | string;
  settled: boolean;
}) {
  const config = getDieConfig(dieType);
  const stroke = settled
    ? "var(--mantine-color-blue-filled)"
    : "var(--mantine-color-gray-filled)";
  const fill = "var(--mantine-color-body)";
  const sharedShapeProps = {
    fill,
    stroke,
    strokeWidth: 3.5,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 100 100"
      width={60}
      height={60}
      style={{ display: "block", flexShrink: 0 }}
    >
      {config.circle ? (
        <circle cx="50" cy="50" r="43" {...sharedShapeProps} />
      ) : (
        <polygon points={config.points} {...sharedShapeProps} />
      )}
      <text
        x="50"
        y={config.valueY}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: "32px",
          fontWeight: 700,
          fill: "var(--mantine-color-text)",
          fontFamily: "inherit",
        }}
      >
        {value}
      </text>
      <text
        x="50"
        y={config.labelY}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: "16px",
          fill: "var(--mantine-color-dimmed)",
          fontFamily: "inherit",
        }}
      >
        {dieType}
      </text>
    </svg>
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

  return <DieShape dieType={dieType} value={displayValue} settled={false} />;
}

function StaticDiceResults({ diceResults }: { diceResults: DiceResult[] }) {
  return (
    <Flex wrap="wrap" gap="xs" p="xs">
      {diceResults.map((result, i) => (
        <DieShape
          key={i}
          dieType={result.dieType}
          value={result.value}
          settled={true}
        />
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
