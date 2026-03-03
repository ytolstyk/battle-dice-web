# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # TypeScript compile + Vite production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

No test suite is configured.

## Architecture

This is a React + TypeScript SPA (Vite) for a real-time multiplayer dice-rolling game called "Battle Dice."

### Data Flow

1. **User identity** is persisted to `localStorage` via `useUserStorage` hook (userId via `nanoid`, userName). `UserContext`/`UserProvider` expose this globally.
2. **Real-time state** flows exclusively through Socket.IO (`src/helpers/socket.ts`). The singleton socket connects to the battle-dice-server (prod: `https://battle-dice-server.onrender.com`, dev: `http://localhost:8080`, path `/battle-dice`).
3. **`useDiceWebSocket`** (`src/hooks/useDiceWebSocket.ts`) is the central hook — it manages socket lifecycle, emits actions (`joinRoom`, `leaveRoom`, `rollDice`, `updateDiceRules`, `updateUserRollResult`, `updateUserName`), and receives `Room` state updates. All server events update the local `room` state.
4. **Winner determination** is computed client-side in `useDiceWebSocket` — all participants must have rolled, then the highest `roll.total` wins.

### Key Types (`src/components/types.ts`)

- `Room` — `{ id, ownerId, diceRules, participants: User[] }`
- `User` — `{ id, name, status: "connected"|"disconnected"|"rolling"|"hasRolled", roll: Roll }`
- `Roll` — `{ diceResults: DiceResult[], total: number }`

### Routes

- `/` — `Home`: enter name, create or join room
- `/rooms/:roomId` — `Room`: the main game view
- `/rooms/` — `NoRoomId`: redirect/error page

### 3D Dice Rendering

`DiceTray` uses `@3d-dice/dice-box` (WebAssembly via `vite-plugin-wasm`). The dice canvas is rendered outside React's DOM tree and manually moved inside a ref container after init. Assets must be in `public/assets/` (the `dice-box` WebAssembly and theme files are under `src/assets/dice-box/` and served via Vite's asset pipeline). Dice notation is parsed by `@3d-dice/dice-parser-interface`. Results flow: `DiceBox.onRollComplete` → `parseDiceBoxResults` (maps raw rolls to `Roll`) → `updateUserRollResult` socket emit.

### Room Ownership

Only the room owner (`room.ownerId === userId`) can change `diceRules`. The dice rules input is throttled (1 second) before emitting `updateDiceRules`.

### Invite/Join Flow

- **Share**: `ShareRoomModal` shows a QR code and copyable URL for `/rooms/:roomId`.
- **Join**: `JoinRoomModal` accepts a typed room ID or uses the camera (`react-qr-barcode-scanner`) to scan a QR code, then navigates to the room route.

### Build Notes

- `__COMMIT_HASH__` is injected at build time via `vite.config.ts` (uses `git rev-parse --short HEAD`) and written to a meta tag in `<head>`.
- WASM support requires `vite-plugin-wasm` and `vite-plugin-top-level-await`.
- Styles use Mantine's PostCSS preset (`postcss-preset-mantine`, `postcss-simple-vars`).
