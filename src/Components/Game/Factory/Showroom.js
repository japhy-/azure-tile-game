import React, { useContext } from 'react'
import Tile from '../Tile'
import { GameContext } from '../'

export const Showroom = ({showroom}) => {
  const { backup, action, players: { color, active: { chooseTiles} }, factory: { surplus, showrooms } } = useContext(GameContext)

  const selectTiles = (tile) => {
    action.set('place')
    color.set(null)

    const chosen = []
    const rejected = []

    showroom.tiles.forEach(t => (t.color === tile.color ? chosen : rejected).push(t))

    // console.log(`you selected ${chosen.length} ${tile.color} tiles from floor ${showroom.id}`)
    // console.log(`${rejected.length} tiles go to the surplus`)

    backup.set({
      id: showroom.id, chosen, rejected, played: []
    })

    surplus.set(s => { return { ...s, tiles: [...s.tiles, ...rejected] } })
    chooseTiles(chosen)

    showroom.tiles = []
    showrooms.set([...showrooms.get])
  }

  return (
    <div className={`Showroom flex ${showroom.tiles.length === 0 ? 'empty' : ''}`}>
      <div className="Tiles flex wrap just-evenly">
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

export default Showroom
