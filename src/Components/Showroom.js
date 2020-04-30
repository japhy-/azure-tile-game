import React, { useContext } from 'react'
import Tile from './Tile'
import { GameContext } from '../App'

const Showroom = ({showroom}) => {
  const { action, players: { color, active: { chooseTiles} }, factory: { surplus, showrooms } } = useContext(GameContext)

  const selectTiles = (tile) => {
    action.set('place')

    const chosen = []
    const rejected = []

    showroom.tiles.forEach(t => (t.color === tile.color ? chosen : rejected).push(t))

    // console.log(`you selected ${chosen.length} ${tile.color} tiles from floor ${showroom.id}`)
    // console.log(`${rejected.length} tiles go to the surplus`)

    surplus.set(s => { return { ...s, tiles: [...s.tiles, ...rejected] } })
    chooseTiles(chosen)

    showroom.tiles = []
    showrooms.set([...showrooms.get])
  }

  return (
    <div className={`Showroom ${showroom.tiles.length === 0 ? 'empty' : ''}`}>
      <div className="Tiles">
        {showroom.tiles.map(t =>
          <Tile key={`tile-${t.id}`} color={t.color}
            onClick={action.get === 'draw' ? () => selectTiles(t) : null}
            onMouseOver={() => color.set(t.color)}
            onMouseOut={() => color.set(null)}
          />
        )}
      </div>
    </div>
  )
}

const initializeShowrooms = (nplayers) => {
  const showrooms = []
  for (let i = 0; i < nplayers * 2 + 1; i++) showrooms.push({id: i, tiles: []})
  return showrooms
}

export default Showroom
export { initializeShowrooms }
