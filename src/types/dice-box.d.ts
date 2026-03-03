// Shared types between @3d-dice/dice-box and @3d-dice/dice-parser-interface

type DiceBoxRoll = {
  sides: number;
  dieType: string;
  groupId: number;
  rollId: number | string; // rerolled dice get incremented string ids like "1.1", "1.2"
  theme: string;
  themeColor: string;
  value: number;
};

// A die group as returned by dice-box's onRollComplete
type DiceBoxRollResult = {
  qty: number;
  modifier: number;
  sides: number;
  rolls: DiceBoxRoll[];
  id: number;
  value: number;
  mods?: DieGroupMod[];
};

// Reroll request produced by DiceParser.handleRerolls, consumed by DiceBox.reroll
type RerollRequest = {
  groupId: number;
  rollId: string;
  sides: number;
  qty: number;
};

// A die group as produced by DiceParser.parseNotation, consumed by DiceBox.roll
type DieGroup = {
  qty: number;
  sides: number | string;
  mods: DieGroupMod[];
  themeColor?: string;
  theme?: string;
};

type DieGroupMod = {
  type: string;
  highlow?: "h" | "l";
  expr?: { type: string; value: number }; // keep/drop count, success/failure threshold
  mod?: string; // comparison operator for success/failure (">" | "<" | "=")
  target?: { type?: string; mod: string | null; value: { type: string; value: number } }; // explode/reroll threshold
};

// Result returned by DiceParser.parseFinalResults
type ParsedFinalResult = {
  type: string;
  value: number;
  success: boolean | null;
  successes: number;
  failures: number;
  valid: boolean;
};

declare module "@3d-dice/dice-box" {
  interface DiceBoxOptions {
    id?: string;
    theme?: string;
    assetPath?: string;
    scale?: number;
    onRollComplete?: (results: DiceBoxRollResult[]) => void;
    [key: string]: unknown;
  }

  class DiceBoxClass {
    constructor(options?: DiceBoxOptions);
    init(): Promise<void>;
    show(): this;
    hide(): this;
    clear(): void;
    roll(arg: DieGroup[] | string): void;
    reroll(arg: RerollRequest[]): void;
    add(roll: DieGroup | string, groupId?: string | number): void;
  }

  export default DiceBoxClass;
}

declare module "@3d-dice/dice-parser-interface" {
  export default class DiceParser {
    constructor(options?: {
      targetRollsCritSuccess?: boolean;
      targetRollsCritFailure?: boolean;
      targetRollsCrit?: boolean;
    });
    parseNotation(input: string): DieGroup[];
    handleRerolls(results: DiceBoxRollResult[]): RerollRequest[];
    parseFinalResults(results: DiceBoxRollResult[]): ParsedFinalResult;
    clear(): void;
  }
}
