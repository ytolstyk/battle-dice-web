declare module "@3d-dice/dice-box" {
  interface DiceBoxOptions {
    id?: string;
    theme?: string;
    assetPath?: string;
    [key: string]: unknown;
  }

  type RollResult = {
    qty: number;
    modifier: number;
    sides: number;
    rolls: {
      sides: number;
      dieType: string;
      groupId: number;
      rollId: number;
      theme: string;
      themeColor: string;
      value: number;
    }[];
    id: number;
    value: number;
  };
  type OnRollCompleteHandler = (results: RollResult[]) => void;

  class DiceBoxClass {
    constructor(options?: DiceBoxOptions);
    init(): Promise<void>;
    show(): this & { roll: (data: any) => void };
    hide(): this & { clear: () => void };
    clear(): void;
    roll(arg: string): void;
    add(roll: string, groupId?: string | number): void;
    onRollComplete?: OnRollCompleteHandler;
  }

  export default DiceBoxClass;
}

declare module "@3d-dice/dice-ui/src/displayResults" {
  export default class DisplayResults {
    constructor(selector?: string);

    /**
     * Show parsed/final dice results in the UI.
     * The shape of results is unknown here, use `any` or refine as you learn it.
     */
    showResults(results: any): void;

    /** Clear any shown results */
    clear(): void;
  }
}

declare module "@3d-dice/dice-parser-interface" {
  export default class DiceParser {
    constructor(...args: any[]);
    parse?(input: string): any;
    parseNotation(input: string): any;
  }
}
