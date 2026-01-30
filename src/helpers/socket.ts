import { io } from "socket.io-client";

const URL =
  process.env.NODE_ENV === "production"
    ? "https://battle-dice-server.onrender.com"
    : "http://localhost:8080";

export const socket = io(URL, { path: "/battle-dice", autoConnect: false });
