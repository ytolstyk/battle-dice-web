import DiceBoxClass from "@3d-dice/dice-box";
import DiceParser from "@3d-dice/dice-parser-interface";
import { useEffect, useRef, useState } from "react";
import { type RollResult, type User } from "./types";
import styles from "./diceTray.module.css";
import "./styles.css";
import { Button, Center, Text, Paper, Flex } from "@mantine/core";
import { parseDiceBoxResults } from "../helpers/resultsParser";
import { IconLaurelWreath } from "@tabler/icons-react";

type Props = {
  diceCombination: string;
  isWinner: boolean;
  roomUser?: User | null;
  onRollDice: () => void;
  onRollDiceResult: (res: RollResult[]) => void;
};

export function DiceTray({
  diceCombination,
  isWinner,
  roomUser,
  onRollDice,
  onRollDiceResult,
}: Props) {
  const DRP = new DiceParser();
  const [rollResult, setRollResult] = useState<RollResult[]>([]);
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
          setRollResult(results);
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
    setRollResult([]);
    setIsDisabled(true);

    if (diceBoxInstance) {
      diceBoxInstance.roll(DRP.parseNotation(diceCombination));
      onRollDice();
    }
  };

  const renderResult = () => {
    if (rollResult.length === 0) {
      return null;
    }

    const { total } = parseDiceBoxResults(rollResult);
    const icon = isWinner ? (
      <IconLaurelWreath size={24} color="var(--mantine-color-blue-filled)" />
    ) : null;

    return (
      <Flex align="center">
        <Text p="xs" fw="bold">
          Result: {total}
        </Text>
        {icon}
      </Flex>
    );
  };

  const buttonDisabled = isDisabled || roomUser?.status === "hasRolled";

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
              <Text pt="xs" pl="xs" size="xl" fw="bold">
                {roomUser?.name}
              </Text>
              {renderResult()}
            </div>
          </div>
        </Paper>
      </Center>
      <Center>
        <Button onClick={handleRoll} disabled={buttonDisabled}>
          Roll {diceCombination}
        </Button>
      </Center>
    </>
  );
}
