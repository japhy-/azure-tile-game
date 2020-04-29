import React from 'react'
import Tile, { TILE_SIZE } from './Tile'

const FactoryFloor = ({floor, action, setAction, setSurplusTiles, chooseTiles, setEmptyFloors}) => {
  const selectTiles = (tile) => {
    setAction('place')
    const chosenTiles = []
    const surplusTiles = []
    floor.tiles.forEach(t => {
      (t.color === tile.color ? chosenTiles : surplusTiles).push(t)
    });
    console.log(`you selected ${chosenTiles.length} ${tile.color} tile(s) from floor ${floor.id}`)
    console.log(`${surplusTiles.length} tiles go to the surplus`)
    setSurplusTiles(tiles => [...tiles, ...surplusTiles])
    chooseTiles(chosenTiles)
    floor.tiles = []
    setEmptyFloors(f => f+1)
  }

  return (
    <div className="FactoryFloor" style={{
      backgroundColor: floor.tiles.length ? 'pink' : 'gray',
      width: `${TILE_SIZE*3.5}px`,
      height: `${TILE_SIZE*3.5}px`,
    }}>
      <div className="Tiles" style={{
        width: `${TILE_SIZE*3}px`,
        height: `${TILE_SIZE*3}px`,
        paddingLeft: `${TILE_SIZE/2}px`,
        paddingTop: `${TILE_SIZE/2}px`,
      }}>
        {floor.tiles.map(t => <Tile key={`tile-${t.id}`} color={t.color} border={t.border} onClick={action === 'draw' ? () => selectTiles(t) : null}/>)}
      </div>
    </div>
  )
}

export default FactoryFloor