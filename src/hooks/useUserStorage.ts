import { nanoid } from "nanoid";
import { useState } from "react";
import { getItem, setItem } from "../helpers/localStorageAccessor";

const USER_ID_KEY = "opposing-dice:userId";
const USER_NAME_KEY = "opposing-dice:userName";

export default function useUserStorage() {
  const [userId] = useState<string>(() => {
    try {
      const existing = getItem<string>(USER_ID_KEY);

      if (existing) return existing;

      const id = nanoid();
      setItem(USER_ID_KEY, id);

      return id;
    } catch {
      return "";
    }
  });

  const [userName, setUserName] = useState<string>(() => {
    try {
      const existing = getItem<string>(USER_NAME_KEY);

      if (existing) return existing;

      return "";
    } catch {
      return "";
    }
  });

  const saveUserName = (name: string) => {
    try {
      setItem(USER_NAME_KEY, name);
      setUserName(name);
    } catch {
      // ignore
    }
  };

  return { userId, userName, saveUserName };
}
