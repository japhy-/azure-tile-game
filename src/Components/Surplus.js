import React from 'react'
import Tile, { PenaltyTile } from './Tile'

const Surplus = ({penalty=true, tiles=[], takeSurplusTiles, action}) => {
  return (
    <div className="Surplus" style={{display: 'flex', justifyContent: 'center'}}>
      <span style={{alignSelf: 'center'}}>Surplus:</span>
      {penalty && <PenaltyTile/>}
      {tiles.sort((a, b) => a.color.localeCompare(b.color)).map(t => <Tile key={`tile-${t.id}`} color={t.color} onClick={action === 'draw' ? () => takeSurplusTiles(t) : null}/>)}
    </div>
  )
}

export default Surplus