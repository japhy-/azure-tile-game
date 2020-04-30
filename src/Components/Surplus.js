import React, { useContext } from 'react'
import Tile, { PenaltyTile } from './Tile'
import { GameContext } from '../App'

const Surplus = () => {
  const { action, players, factory: { surplus } } = useContext(GameContext)

  const takeSurplusTiles = (tile) => {
    action.set('place')

    const chosen = []
    const rejected = []

    surplus.get.tiles.forEach(t => (t.color === tile.color ? chosen : rejected).push(t))

    // console.log(`you selected ${chosen.length} ${tile.color} tiles from the surplus`)
    // console.log(`${rejected.length} tiles remain in the surplus`)
    if (surplus.get.penalty) {
      // console.log(`you take the -1 penalty for being the first player to take tiles from the surplus`)
      players.list.get[players.active.get].floor.push({penalty: true})

      // console.log(`but you (player ${players.active.get} will go first next round`)
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
        <Tile key={`tile-${t.id}`} color={t.color} onClick={action.get === 'draw' ? () => takeSurplusTiles(t) : null}/>
      )}
    </div>
  )
}

export default Surplus