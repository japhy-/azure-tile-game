import React, { useContext } from 'react';
import { GameContext } from '..';
import { forN } from '../../../utilities/Functions';
import { PlayerContext } from '../Player'
import { ActivePlayerContext } from '../Player/ActivePlayer'
import { TileTableCell } from "./TileTableCell";

export const TileTableRow = ({ row, tiles }) => {
  const { action, players: { color } } = useContext(GameContext);
  const { playTile, placed } = useContext(ActivePlayerContext);
  const { wall, hand } = useContext(PlayerContext);

  const blanks = 4 - row;

  const canPlaceTile = ((action.get === 'draw' && color.get) || (hand.length > 0 && playTile))
    && (placed === null || placed === row)
    && (tiles.length === 0 || (tiles[0].color === (action.get === 'draw' ? color.get : hand[0].color) && tiles.length < row + 1))
    && wall[row].filter(t => t && t.color === (action.get === 'draw' ? color.get : hand[0].color)).length === 0;

  return (
    <tr className={`TileTableRow ${canPlaceTile ? 'can-drop' : 'cannot-drop'}`} onClick={canPlaceTile ? () => playTile(row) : null}>
      {forN(blanks).map(i => <TileTableCell key={`tiletablecell-${row}-${i}`} blank />
      )}
      {forN(row + 1).map(i => <TileTableCell key={`tiletablecell-${row}-${blanks + i}`} tile={tiles[i]} />
      )}
    </tr>
  );
};
