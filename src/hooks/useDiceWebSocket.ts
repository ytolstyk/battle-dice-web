import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { socket } from "../helpers/socket";
import { type Room, type ConnectingUser, type Roll } from "../components/types";
import { UserContext } from "../components/UserContext";
import { notifications } from "@mantine/notifications";

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

  const prevParticipantsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!room) return;

    const currentIds = new Set(room.participants.map((u) => u.id));
    const prev = prevParticipantsRef.current;

    if (prev.size > 0) {
      for (const participant of room.participants) {
        if (participant.id !== userId && !prev.has(participant.id)) {
          notifications.show({
            title: "Player joined",
            message: `${participant.name || "Someone"} joined the room`,
            color: "blue",
            autoClose: 4000,
          });
        }
      }

      for (const [id, name] of prev) {
        if (id !== userId && !currentIds.has(id)) {
          notifications.show({
            title: "Player left",
            message: `${name || "Someone"} left the room`,
            color: "gray",
            autoClose: 4000,
          });
        }
      }
    }

    prevParticipantsRef.current = new Map(
      room.participants.map((u) => [u.id, u.name]),
    );
  }, [room, userId]);

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

  const requestReroll = useCallback(
    (roomId: string) => {
      socket.emit("requestReroll", { roomId, userId });
    },
    [userId],
  );

  const approveReroll = useCallback(
    (roomId: string, targetUserId: string) => {
      socket.emit("approveReroll", { roomId, userId, targetUserId });
    },
    [userId],
  );

  const declineReroll = useCallback(
    (roomId: string, targetUserId: string) => {
      socket.emit("declineReroll", { roomId, userId, targetUserId });
    },
    [userId],
  );

  const updateUserName = useCallback(
    (roomId: string, name: string) => {
      const payload = {
        roomId,
        userId,
        userName: name,
      };

      socket.emit("updateUserName", payload);
    },
    [userId],
  );

  const resetRoom = useCallback(
    (roomId: string) => {
      if (room?.ownerId !== userId) {
        return;
      }

      socket.emit("resetRoom", { roomId, userId });
    },
    [userId, room?.ownerId],
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
    socket.on("rerollRequested", setRoom);
    socket.on("rerollResolved", setRoom);

    return () => {
      leaveRoom(room?.id ?? "");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("roomUpdated", setRoom);
      socket.off("diceRulesUpdated", setRoom);
      socket.off("diceRolled", setRoom);
      socket.off("rollResult", setRoom);
      socket.off("userNameUpdated", setRoom);
      socket.off("rerollRequested", setRoom);
      socket.off("rerollResolved", setRoom);
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
    requestReroll,
    approveReroll,
    declineReroll,
    updateUserName,
    resetRoom,
  };
}
