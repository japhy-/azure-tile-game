import React, { useContext } from 'react';
import Tile from '../Tile';
import { GameContext } from '..';
import { PlayerContext } from '.';
import { UndoButton } from './UndoButton'

export const Hand = () => {
  const { action, players: { color } } = useContext(GameContext);
  const { hand: tiles } = useContext(PlayerContext);

  return (
    <div className="Hand flex just-centered">
      <b className="centered">Hand:</b>
      <div className="flex centered">
        {tiles.map(t => <Tile key={`tile-${t.id}`} color={t.color}
          onMouseOver={() => color.set(t.color)}
          onMouseOut={() => color.set(null)} />)}
        {action.get === 'place' && <UndoButton />}
      </div>
    </div>
  );
};
