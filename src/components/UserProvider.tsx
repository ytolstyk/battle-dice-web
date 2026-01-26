import React from "react";
import useUserStorage from "../hooks/useUserStorage";
import { UserContext } from "./UserContext";

type Props = {
  children: React.ReactNode;
};

export const UserProvider = ({ children }: Props) => {
  const { userId, userName, saveUserName } = useUserStorage();

  return (
    <UserContext.Provider
      value={{
        userId,
        userName,
        saveUserName,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
