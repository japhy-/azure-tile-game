import React, { useContext } from 'react';
import { forN } from '../../../utilities/Functions';
import { PlayerContext } from '.';
import { WallRow } from "./WallRow";

export const Wall = () => {
  const { wall } = useContext(PlayerContext);

  return (
    <div className="Wall flex columns just-centered">
      <b className="centered">Wall</b>
      <table>
        <tbody>
          {forN(5).map(i => <WallRow key={`wallrow-${i}`} row={i} tiles={wall[i]} />
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Wall