import DiceBoxClass from "@3d-dice/dice-box";
import DiceParser from "@3d-dice/dice-parser-interface";
import { useEffect, useRef, useState } from "react";

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
import { type RollResult, type User } from "./types";
import styles from "./diceTray.module.css";
import "./styles.css";
import { Button, Center, Text, Paper, Flex } from "@mantine/core";
import { IconLaurelWreath } from "@tabler/icons-react";

type Props = {
  diceCombination?: string;
  isConnected: boolean;
  isWinner: boolean;
  roomUser?: User | null;
  onRollDice: () => void;
  onRollDiceResult: (res: RollResult[]) => void;
};

export function DiceTray({
  diceCombination,
  isWinner,
  isConnected,
  roomUser,
  onRollDice,
  onRollDiceResult,
}: Props) {
  const DRP = new DiceParser();
  const [isDisabled, setIsDisabled] = useState(false);
  const diceBoxId = "dice-box-main";

  const diceBoxRef = useRef<HTMLDivElement>(null);
  const [diceBoxInstance, setDiceBoxInstance] = useState<DiceBoxClass>();

  useEffect(() => {
    if (diceBoxRef.current) {
      const DiceBox = new DiceBoxClass({
        id: diceBoxId,
        assetPath: "/assets/",
        scale: 6,
        onRollComplete: (results: RollResult[]) => {
          setIsDisabled(false);
          onRollDiceResult(results);
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

  const handleRoll = () => {
    setIsDisabled(true);

    if (diceBoxInstance) {
      const color = getRandomDiceColor();
      const notation = DRP.parseNotation(diceCombination || "").map(
        (group: object) => ({ ...group, themeColor: color }),
      );
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

    const { total } = roomUser.roll;

    return (
      <Text pl="xs" fw="bold">
        Result: {total}
      </Text>
    );
  };

  const buttonDisabled =
    !isConnected || isDisabled || roomUser?.status === "hasRolled";
  const icon = isWinner ? (
    <IconLaurelWreath size={24} color="var(--mantine-color-blue-filled)" />
  ) : null;

  return (
    <>
      <Center mb="sm">
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
      </Center>
      <Center>
        <Button onClick={handleRoll} disabled={buttonDisabled}>
          Roll {diceCombination || ""}
        </Button>
      </Center>
    </>
  );
}
