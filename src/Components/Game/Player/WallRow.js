import React from 'react';
import { TILE_ORDER } from '../Tile';
import { forN } from '../../../utilities/Functions';
import { WallCell } from "./WallCell";

export const WallRow = ({ row, tiles, custom }) => {
  return (
    <tr className="WallRow">
      {forN(5).map(i => <WallCell key={`wallcell-${row}-${i}`} row={row} col={i} tile={tiles[i] || { color: custom ? 'silver' : TILE_ORDER[(row + i) % 5] }} />
      )}
    </tr>
  );
};

export default WallRow