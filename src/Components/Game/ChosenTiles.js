import React from 'react'
import Tile from './Tile'

const ChosenTiles = ({tiles=[]}) => {
  return (
    <div className="ChosenTiles" style={{display: 'flex', justifyContent: 'center'}}>
      <span style={{alignSelf: 'center'}}>Hand:</span>
      {tiles.map(t => <Tile key={`tile-${t.id}`} color={t.color} border={t.border}/>)}
    </div>
  )
}

export default ChosenTiles