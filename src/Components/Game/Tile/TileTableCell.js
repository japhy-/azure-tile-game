import React from 'react';
import Tile from '.';
import { SlotTile } from "./SlotTile"

export const TileTableCell = ({ blank = false, tile = null }) => {
  return (
    <td className="TileTableCell">
      {blank ? "" : (tile ? <Tile color={tile.color} /> : <SlotTile />)}
    </td>
  );
};
