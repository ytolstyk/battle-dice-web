import { customAlphabet } from "nanoid";

export const ROOM_ID_LENGTH = 6;

export const regexTester = new RegExp(
  `/rooms/([a-z]{${ROOM_ID_LENGTH}})`,
  "gi"
);

const alphabet = "abcdefghijklmnopqrstuvwxyz";

export const generateRoomId = customAlphabet(alphabet, ROOM_ID_LENGTH);
