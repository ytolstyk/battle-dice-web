import type { User } from "./types";

type Props = {
  player: User;
};

export function OpponentTray({ player }: Props) {
  function renderStatus() {
    return <div>{player.status}</div>;
  }

  function renderResult() {
    if (!player.roll.total || player.roll.diceResults.length < 1) {
      return null;
    }

    return <div>{player.roll.total}</div>;
  }

  return (
    <div>
      <h2>{player.name}</h2>
      {renderStatus()}
      {renderResult()}
    </div>
  );
}
