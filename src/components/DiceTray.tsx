import DiceBoxClass from "@3d-dice/dice-box";
import DiceParser from "@3d-dice/dice-parser-interface";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { type RollResult, type Roll, type User, type DieType } from "./types";
import styles from "./diceTray.module.css";
import "./styles.css";
import { Button, Text, Paper, Flex } from "@mantine/core";
import { IconLaurelWreath } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { AddUserName } from "./AddUserName";

const DICE_COLORS = [
  "#e74c3c",
  "#e67e22",
  "#f1c40f",
  "#2ecc71",
  "#1abc9c",
  "#3498db",
  "#9b59b6",
  "#e91e63",
  "#00bcd4",
  "#ff5722",
];

function getRandomDiceColor() {
  return DICE_COLORS[Math.floor(Math.random() * DICE_COLORS.length)];
}

function formatModDescription(groups: DieGroup[]): string {
  const parts: string[] = [];

  for (const group of groups) {
    if (!group.mods?.length) continue;

    for (const mod of group.mods) {
      const exprVal = mod.expr?.value;
      const targetVal = mod.target?.value?.value;
      const targetMod = mod.target?.mod;

      switch (mod.type) {
        case "keep":
          parts.push(
            `keep ${mod.highlow === "h" ? "highest" : "lowest"} ${exprVal}`,
          );
          break;
        case "drop":
          parts.push(
            `drop ${mod.highlow === "h" ? "highest" : "lowest"} ${exprVal}`,
          );
          break;
        case "explode":
          parts.push(
            targetVal !== undefined
              ? `explode ${targetMod}${targetVal}`
              : "explode on max",
          );
          break;
        case "compound":
          parts.push(
            targetVal !== undefined
              ? `compound ${targetMod}${targetVal}`
              : "compound explode",
          );
          break;
        case "penetrate":
          parts.push("penetrate");
          break;
        case "reroll":
          parts.push(
            targetVal !== undefined
              ? `reroll ${targetMod}${targetVal}`
              : "reroll 1s",
          );
          break;
        case "rerollOnce":
          parts.push(
            targetVal !== undefined
              ? `reroll once ${targetMod}${targetVal}`
              : "reroll once on 1",
          );
          break;
        case "success":
          parts.push(`successes ${mod.mod}${exprVal}`);
          break;
        case "failure":
          parts.push(`failures ${mod.mod ?? ""}${exprVal ?? ""}`);
          break;
      }
    }
  }

  return parts.join(" · ");
}

type Props = {
  diceCombination?: string;
  isConnected: boolean;
  isOwner: boolean;
  isWinner: boolean;
  roomUser?: User | null;
  onRollDice: () => void;
  onRollDiceResult: (roll: Roll) => void;
  onRequestReroll: () => void;
  onResetRoom: () => void;
};

export function DiceTray({
  diceCombination,
  isWinner,
  isConnected,
  isOwner,
  roomUser,
  onRollDice,
  onRollDiceResult,
  onRequestReroll,
  onResetRoom,
}: Props) {
  const drpRef = useRef(new DiceParser());
  const modDescriptionRef = useRef("");
  const [isDisabled, setIsDisabled] = useState(false);
  const diceBoxId = "dice-box-main";

  const diceBoxRef = useRef<HTMLDivElement>(null);
  const [diceBoxInstance, setDiceBoxInstance] = useState<DiceBoxClass>();

  const buttonDisabledRef = useRef(false);
  const handleRollRef = useRef<() => void>(null);
  const motionPermissionRef = useRef(false);

  useEffect(() => {
    if (diceBoxRef.current) {
      const DiceBox = new DiceBoxClass({
        id: diceBoxId,
        assetPath: "/assets/",
        scale: 6,
        onRollComplete: (rawResults) => {
          const results = rawResults as RollResult[];
          const rerolls = drpRef.current.handleRerolls(results);
          if (rerolls.length > 0) {
            DiceBox.reroll(rerolls);
            return;
          }
          const finalResults = drpRef.current.parseFinalResults(results);
          setIsDisabled(false);
          onRollDiceResult({
            diceResults: results.flatMap((group) =>
              group.rolls.map((r) => ({
                dieType: r.dieType as DieType,
                value: r.value,
              })),
            ),
            total: finalResults.value,
            modDescription: modDescriptionRef.current || undefined,
          });
        },
      });

      DiceBox.init().then(() => {
        setDiceBoxInstance(DiceBox);

        /*
          Canvas appears outside the React DOM tree.
          We need to put it inside the tree before rolling, so we can style it
          and make it look like it's inside the app.
        */
        const canvas = document.getElementsByClassName("dice-box-canvas")[0];

        if (diceBoxRef.current) {
          canvas.removeAttribute("width");
          canvas.removeAttribute("height");
          diceBoxRef.current.appendChild(canvas);
        }
      });
    }

    return () => {
      // remove the canvas + listeners
      Array.from(document.getElementsByClassName("dice-box-canvas")).forEach(
        (el) => el.remove(),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isWinner) return;
    const end = Date.now() + 3000;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    navigator.vibrate?.([100, 50, 100, 50, 300]);

    document.body.classList.add("screen-shake");
    const timer = setTimeout(
      () => document.body.classList.remove("screen-shake"),
      600,
    );
    return () => clearTimeout(timer);
  }, [isWinner]);

  useEffect(() => {
    const THRESHOLD = 15;
    const COOLDOWN_MS = 1500;
    let lastX = 0,
      lastY = 0,
      lastZ = 0;
    let lastShakeTime = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (buttonDisabledRef.current) return;
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const now = Date.now();
      const deltaX = Math.abs((acc.x ?? 0) - lastX);
      const deltaY = Math.abs((acc.y ?? 0) - lastY);
      const deltaZ = Math.abs((acc.z ?? 0) - lastZ);

      lastX = acc.x ?? 0;
      lastY = acc.y ?? 0;
      lastZ = acc.z ?? 0;

      if (
        (deltaX > THRESHOLD || deltaY > THRESHOLD || deltaZ > THRESHOLD) &&
        now - lastShakeTime > COOLDOWN_MS
      ) {
        lastShakeTime = now;
        handleRollRef.current?.();
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  const handleRoll = () => {
    // Request iOS motion permission on first user gesture
    if (
      !motionPermissionRef.current &&
      typeof DeviceMotionEvent !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (DeviceMotionEvent as any).requestPermission === "function"
    ) {
      motionPermissionRef.current = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (DeviceMotionEvent as any).requestPermission().catch(() => {});
    }

    setIsDisabled(true);

    if (diceBoxInstance) {
      const color = getRandomDiceColor();
      const parsed = drpRef.current.parseNotation(diceCombination || "");
      modDescriptionRef.current = formatModDescription(parsed);
      const notation = parsed.map((group) => ({ ...group, themeColor: color }));
      diceBoxInstance.roll(notation);
      onRollDice();
    }
  };

  const renderResult = () => {
    if (
      !roomUser ||
      roomUser.roll.diceResults.length === 0 ||
      roomUser.roll.total === 0
    ) {
      return null;
    }

    const { total, modDescription } = roomUser.roll;

    return (
      <>
        {modDescription && (
          <Text pl="xs" size="xs" c="dimmed">
            {modDescription}
          </Text>
        )}
        <Text pl="xs" fw="bold">
          Result: {total}
        </Text>
      </>
    );
  };

  const buttonDisabled =
    !isConnected ||
    isDisabled ||
    roomUser?.status !== "connected" ||
    !diceCombination;

  // Keep refs in sync for use inside the motion event listener
  buttonDisabledRef.current = buttonDisabled;
  handleRollRef.current = handleRoll;

  const handleEditName = () => {
    modals.open({
      title: "Edit Your Name",
      children: <AddUserName />,
      size: "md",
    });
  };

  const icon = isWinner ? (
    <IconLaurelWreath size={24} color="var(--mantine-color-blue-filled)" />
  ) : null;

  return (
    <Flex direction="column" h="100%" align="center" justify="center" gap="sm">
      <Paper shadow="sm" withBorder>
        <div
          id={diceBoxId}
          ref={diceBoxRef}
          className={styles.diceBoxContainer}
        >
          <div className={styles.resultWrapper}>
            <Flex align="center" pt="xs" pl="xs">
              <Text size="xl" fw="bold" mr="xs">
                {roomUser?.name}
              </Text>
              {icon}
            </Flex>
            {renderResult()}
          </div>
        </div>
      </Paper>
      <Flex gap="sm">
        <Button variant="light" onClick={handleEditName}>
          Edit Name
        </Button>
        <Button onClick={handleRoll} disabled={buttonDisabled}>
          Roll{" "}
          {diceCombination && diceCombination.length <= 10
            ? diceCombination
            : ""}
        </Button>
        {!isOwner && roomUser?.status === "hasRolled" && (
          <Button
            variant="light"
            onClick={onRequestReroll}
            disabled={!isConnected}
          >
            Request Reroll
          </Button>
        )}
        {isOwner && (
          <Button
            variant="subtle"
            onClick={onResetRoom}
            disabled={!isConnected}
          >
            Reset
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
