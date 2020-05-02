import React, { useContext } from 'react'
import Tile, { PenaltyTile } from './Tile'
import { GameContext } from '.'

const Surplus = () => {
  const { action, players, factory: { surplus } } = useContext(GameContext)

  const takeSurplusTiles = (tile) => {
    action.set('place')
    players.color.set(null)

    const chosen = []
    const rejected = []

    surplus.get.tiles.forEach(t => (t.color === tile.color ? chosen : rejected).push(t))

    if (surplus.get.penalty) {
      players.list.get[players.active.get].floor.push({penalty: true})
      players.next.set(players.active.get)
      surplus.get.penalty = false
    }

    surplus.set(s => { return { ...s, tiles: rejected } })
    players.active.chooseTiles(chosen)
  }

  return (
    <div className="Surplus">
      <span>Surplus:</span>
      {surplus.get.penalty && <PenaltyTile/>}
      {surplus.get.tiles.map(t =>
        <Tile key={`tile-${t.id}`} color={t.color} onClick={action.get === 'draw' ? () => takeSurplusTiles(t) : null}
          onMouseOver={() => players.color.set(t.color)}
          onMouseOut={() => players.color.set(null)}
        />
      )}
    </div>
  )
}

export default Surplus