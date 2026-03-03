# Battle Dice

A real-time multiplayer dice-rolling game played in the browser. Why settle disputes with words when you can roll dice? Players join a shared room, roll 3D dice simultaneously, and the highest total wins.

## How to Play

1. **Create a room** — enter your name on the home screen and click Create Room
2. **Invite opponents** — share the room link or QR code with other players
3. **Roll** — click the Roll button (or shake your phone) when ready
4. **Win** — once all players have rolled, the highest total is declared the winner

## Features

- **3D dice rendering** — physics-based dice via WebAssembly
- **Real-time multiplayer** — all rolls and results sync instantly
- **Custom dice rules** — the room owner sets any dice combination (e.g. `2d6 + 1d8`, `4d6kh3`, exploding dice, etc.)
- **Shake to roll** — on mobile, shake your device instead of tapping the button
- **Reroll requests** — players can request a reroll; the room owner approves or declines
- **Room reset** — the room owner can clear all rolls to start a new round
- **Invite via QR code** — scan to join directly from another device

## Dice Notation

| Example | Meaning |
|---|---|
| `2d6` | Roll two 6-sided dice |
| `1d20 + 2d4` | Roll a d20 and two d4s, sum all |
| `4d6kh3` | Roll 4d6, keep highest 3 |
| `2d6kl1` | Roll 2d6, keep lowest 1 |
| `1d6!` | Roll a d6, explode on max |

## Development

```bash
npm install
npm run dev       # Start dev server at localhost:5173
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

The frontend connects to a Socket.IO server. In development it expects the server at `http://localhost:8080`. See the [server repo](https://github.com/ytolstyk/battle-dice-server) to run it locally.

## Tech Stack

- **React 19 + TypeScript** — UI and application logic
- **Vite** — build tooling with WASM support
- **Mantine** — component library and theming
- **Socket.IO** — real-time communication
- **@3d-dice/dice-box** — WebAssembly 3D dice renderer
- **react-router-dom** — client-side routing
