import React, { useContext } from 'react'
import Tile, { TILE_PENALTIES } from '../Tile'
import { PenaltyTile } from "../Tile/PenaltyTile"
import { SlotTile } from "../Tile/SlotTile"
import { forN } from '../../../utilities/Functions'
import { PlayerContext } from '.'
import { ActivePlayerContext } from './ActivePlayer'

export const PlayerFloor = () => {
  const { playTile } = useContext(ActivePlayerContext)
  const { floor: tiles } = useContext(PlayerContext)

  const canDropTile = playTile

  return (
    <div className={`PlayerFloor flex just-centered ${canDropTile ? 'can-drop' : 'cannot-drop'}`} onClick={canDropTile ? () => playTile(-1) : null}>
      <b className="centered">Floor</b>
      <div className="PlayerFloorTiles flex centered">
        {forN(7).map(i => tiles[i]).map((t = {}, i) => t.penalty ?
          <PenaltyTile key={`tile-penalty`} penalty={true} /> :
          (t.id ? <Tile key={`tile-${t.id}`} color={t.color} score={TILE_PENALTIES[i]} round={TILE_PENALTIES[i]} /> : <SlotTile key={`slot-${i}`} penalty={TILE_PENALTIES[i]} />)
        )}
      </div>
    </div>
  )
}
