import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { socket } from "../helpers/socket";
import { type Room, type ConnectingUser, type Roll } from "../components/types";
import { UserContext } from "../components/UserContext";

export function useDiceWebSocket() {
  const { userName, userId } = useContext(UserContext);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const connectingUser = useMemo(() => {
    return { id: userId, name: userName } as ConnectingUser;
  }, [userName, userId]);

  function onConnect() {
    setIsConnected(true);
  }

  function onDisconnect() {
    setIsConnected(false);
  }

  const roomUser = useMemo(() => {
    if (room) {
      return room.participants.find((u) => u.id === userId);
    }

    return null;
  }, [userId, room]);

  const joinRoom = useCallback(
    (roomId: string) => {
      setIsLoading(true);

      const payload = {
        roomId,
        user: connectingUser,
      };

      socket.emit("joinRoom", payload, () => {
        setIsLoading(false);
      });
    },
    [connectingUser],
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      if (!room || !roomId) {
        return;
      }

      setIsLoading(true);

      const payload = {
        roomId,
        userId,
      };

      socket.emit("leaveRoom", payload, () => {
        setIsLoading(false);
      });
    },
    [userId, room],
  );

  const updateDiceRules = useCallback(
    (roomId: string, diceRules: string) => {
      if (room?.ownerId !== userId) {
        return;
      }

      const payload = {
        roomId,
        userId,
        diceRules,
      };

      socket.emit("updateDiceRules", payload);
    },
    [userId, room?.ownerId],
  );

  const rollDice = useCallback(
    (roomId: string) => {
      const payload = {
        roomId,
        userId,
      };

      socket.emit("rollDice", payload);
    },
    [userId],
  );

  const updateUserRollResult = useCallback(
    (roomId: string, rollResult: Roll) => {
      const payload = {
        roomId,
        userId,
        rollResult,
      };

      socket.emit("updateUserRollResult", payload);
    },
    [userId],
  );

  const winners = useMemo(() => {
    if (!room) {
      return [];
    }

    const { participants } = room;

    const hasWinner = participants.every(
      (user) => user.roll.total && user.roll.diceResults.length > 0,
    );

    if (!hasWinner || participants.length < 2) {
      return [];
    }

    const maxVal = participants.reduce((acc, u) => {
      return Math.max(acc, u.roll.total);
    }, 0);

    return participants.filter((u) => u.roll.total === maxVal);
  }, [room]);

  const updateUserName = useCallback(
    (roomId: string, name: string) => {
      const payload = {
        roomId,
        userId,
        userName: name,
      };

      console.log("sending user name");
      socket.emit("updateUserName", payload);
    },
    [userId],
  );

  useEffect(() => {
    socket.connect();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("roomUpdated", setRoom);
    socket.on("diceRulesUpdated", setRoom);
    socket.on("diceRolled", setRoom);
    socket.on("rollResult", setRoom);
    socket.on("userNameUpdated", setRoom);

    return () => {
      leaveRoom(room?.id ?? "");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.on("roomUpdated", setRoom);
      socket.on("diceRulesUpdated", setRoom);
      socket.off("diceRolled", setRoom);
      socket.off("rollResult", setRoom);
      socket.off("userNameUpdated", setRoom);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isConnected,
    room,
    winners,
    isLoading,
    roomUser,
    joinRoom,
    leaveRoom,
    updateDiceRules,
    updateUserRollResult,
    rollDice,
    updateUserName,
  };
}
