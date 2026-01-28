export type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export type RollResult = {
  qty: number;
  modifier: number;
  sides: number;
  rolls: {
    sides: number;
    dieType: DieType;
    groupId: number;
    rollId: number;
    theme: string;
    themeColor: string;
    value: number;
  }[];
  id: number;
  value: number;
};

export type DiceResult = {
  dieType: DieType;
  value: number;
};

export type Roll = {
  diceResults: DiceResult[];
  total: number;
};

export type ConnectingUser = {
  id: string;
  name: string;
};

export type User = ConnectingUser & {
  status: "connected" | "disconnected" | "rolling" | "hasRolled";
  roll: Roll;
};

export type Room = {
  id: string;
  ownerId: string;
  isOwner: boolean;
  diceRules: string;
  participants: User[];
};
