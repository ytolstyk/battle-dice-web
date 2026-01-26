import { createContext } from "react";

export const UserContext = createContext<{
  userId: string;
  userName: string;
  saveUserName: (name: string) => void;
}>({
  userId: "",
  userName: "",
  saveUserName: () => {},
});
