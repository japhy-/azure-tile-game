import React, { useContext } from 'react';
import { GameContext } from '..';
import { Player } from '.';

export const OtherPlayers = () => {
  const { players } = useContext(GameContext);

  return (
    <div className="OtherPlayers flex columns">
      {players.list.get.map(p => (
        <Player key={`player-${p.id}`} player={p} stub={p.id === players.active.get} />
      ))}
    </div>
  );
};
