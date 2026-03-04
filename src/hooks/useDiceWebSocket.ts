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

function isValidRoom(data: unknown): data is Room {
  if (!data || typeof data !== "object") return false;
  const r = data as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    r.id.length > 0 &&
    typeof r.ownerId === "string" &&
    r.ownerId.length > 0 &&
    typeof r.diceRules === "string" &&
    Array.isArray(r.participants)
  );
}

function showError(message: string) {
  notifications.show({
    title: "Error",
    message,
    color: "red",
    autoClose: 5000,
  });
}

export function useDiceWebSocket() {
  const { userName, userId } = useContext(UserContext);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [room, setRoom] = useState<Room | null>(null);
  const roomRef = useRef<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  roomRef.current = room;

  const connectingUser = useMemo(() => {
    return { id: userId, name: userName } as ConnectingUser;
  }, [userName, userId]);

  function onConnect() {
    setIsConnected(true);
  }

  function onDisconnect() {
    setIsConnected(false);
  }

  function safeSetRoom(data: unknown) {
    if (isValidRoom(data)) {
      setRoom(data);
    } else {
      console.warn("Received invalid Room payload from server:", data);
    }
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
      if (!roomId || !userId) {
        showError("Cannot join room: missing room ID or user ID.");
        return;
      }

      setIsLoading(true);

      const payload = {
        roomId,
        user: connectingUser,
      };

      socket.emit("joinRoom", payload, () => {
        setIsLoading(false);
      });
    },
    [connectingUser, userId],
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      if (!room || !roomId || !userId) {
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

      if (!roomId || !diceRules.trim()) {
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
      if (!roomId || !userId) {
        showError("Cannot roll dice: missing room ID or user ID.");
        return;
      }

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
      if (!roomId || !userId) {
        showError("Cannot submit roll result: missing room ID or user ID.");
        return;
      }

      if (
        !Array.isArray(rollResult.diceResults) ||
        typeof rollResult.total !== "number"
      ) {
        showError("Cannot submit roll result: invalid roll data.");
        return;
      }

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
      if (!roomId || !userId) {
        showError("Cannot request reroll: missing room ID or user ID.");
        return;
      }
      socket.emit("requestReroll", { roomId, userId });
    },
    [userId],
  );

  const approveReroll = useCallback(
    (roomId: string, targetUserId: string) => {
      if (!roomId || !userId || !targetUserId) {
        showError("Cannot approve reroll: missing required fields.");
        return;
      }
      socket.emit("approveReroll", { roomId, userId, targetUserId });
    },
    [userId],
  );

  const declineReroll = useCallback(
    (roomId: string, targetUserId: string) => {
      if (!roomId || !userId || !targetUserId) {
        showError("Cannot decline reroll: missing required fields.");
        return;
      }
      socket.emit("declineReroll", { roomId, userId, targetUserId });
    },
    [userId],
  );

  const updateUserName = useCallback(
    (roomId: string, name: string) => {
      if (!roomId || !userId) {
        showError("Cannot update username: missing room ID or user ID.");
        return;
      }

      if (!name.trim()) {
        showError("Cannot update username: name cannot be empty.");
        return;
      }

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

      if (!roomId || !userId) {
        showError("Cannot reset room: missing room ID or user ID.");
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
    socket.on("connect_error", (err) => {
      showError(`Connection failed: ${err.message}`);
    });
    socket.on("roomUpdated", safeSetRoom);
    socket.on("diceRulesUpdated", safeSetRoom);
    socket.on("diceRolled", safeSetRoom);
    socket.on("rollResult", safeSetRoom);
    socket.on("userNameUpdated", safeSetRoom);
    socket.on("rerollRequested", safeSetRoom);
    socket.on("rerollResolved", safeSetRoom);

    return () => {
      leaveRoom(roomRef.current?.id ?? "");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error");
      socket.off("roomUpdated", safeSetRoom);
      socket.off("diceRulesUpdated", safeSetRoom);
      socket.off("diceRolled", safeSetRoom);
      socket.off("rollResult", safeSetRoom);
      socket.off("userNameUpdated", safeSetRoom);
      socket.off("rerollRequested", safeSetRoom);
      socket.off("rerollResolved", safeSetRoom);
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
