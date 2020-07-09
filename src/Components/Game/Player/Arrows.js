import React from 'react';
import { TILE_SIZE, TILE_BORDER, TILE_MARGIN } from '../Tile';
import { forN } from '../../../utilities/Functions';

export const Arrows = () => {
  return (
    <div className="Arrows flex columns just-centered">
      <br />
      <table>
        <tbody>
          {forN(5).map(i => <tr style={{ height: (TILE_SIZE + 2 * TILE_BORDER + TILE_MARGIN) + 'px' }} key={`arrows-${i}`}>
            <td>&#9654;</td>
          </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
