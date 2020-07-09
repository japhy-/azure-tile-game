import React, { useContext } from 'react';
import { forN } from '../../../utilities/Functions';
import { PlayerContext } from '../Player';
import { TileTableRow } from "./TileTableRow";

export const TileTable = () => {
  const { table } = useContext(PlayerContext);

  return (
    <div className="TileTable flex columns just-centered">
      <b className="centered">Table</b>
      <table>
        <tbody>
          {forN(5).map(i => <TileTableRow key={`tiletablerow-${i}`} row={i} tiles={table[i]} />
          )}
        </tbody>
      </table>
    </div>
  );
};
