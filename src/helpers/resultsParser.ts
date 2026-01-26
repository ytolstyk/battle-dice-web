import type { DiceResult, Roll, RollResult } from "../components/types";

export function parseDiceBoxResults(res: RollResult[]): Roll {
  const result: DiceResult[] = [];
  let total = 0;

  res.forEach((val) => {
    val.rolls.forEach((roll) => {
      total += roll.value;

      result.push({
        dieType: roll.dieType,
        value: roll.value,
      });
    });
  });

  return {
    diceResults: result,
    total,
  };
}
