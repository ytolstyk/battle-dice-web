import { io } from "socket.io-client";

const URL =
  process.env.NODE_ENV === "production"
    ? "wss://battle-dice-server.onrender.com:8080"
    : "ws://localhost:8080";

export const socket = io(URL, { path: "/battle-dice", autoConnect: false });
