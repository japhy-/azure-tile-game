import React, { useContext } from 'react';
import Tile from '../Tile';
import { PlaceholderTile } from "../Tile/PlaceholderTile"
import { GameContext } from '..';
import { PlayerContext } from '.';

export const WallCell = ({ row, col, tile = null }) => {
  const { players: { list, color } } = useContext(GameContext);
  // const { id: activeId } = useContext(ActivePlayerContext)
  const { id } = useContext(PlayerContext);

  const pending = list.get[id].table[row].length > 0
    && list.get[id].table[row][0].color === tile.color
    && (list.get[id].table[row].length === row + 1 ? 2 : 1);

  return (
    <td className="WallCell">
      {tile.id ? <Tile score={tile.score} highlight={tile.highlight} color={tile.color} round={tile.round} /> : <PlaceholderTile color={tile.color} pending={pending} match={color.get === tile.color} />}
    </td>
  );
};

export default WallCell