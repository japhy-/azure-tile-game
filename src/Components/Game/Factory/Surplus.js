import React, { useContext } from 'react'
import Tile from '../Tile'
import { PenaltyTile } from '../Tile/PenaltyTile'
import { GameContext } from '../'

export const Surplus = () => {
  const { messages, backup, action, players, factory: { surplus } } = useContext(GameContext)

  const takeSurplusTiles = (tile) => {
    action.set('place')
    players.color.set(null)

    const chosen = []
    const rejected = []

    surplus.get.tiles.forEach(t => (t.color === tile.color ? chosen : rejected).push(t))

    backup.set({
      id: -1, chosen, rejected, played: [], penalty: surplus.get.penalty
    })

    if (surplus.get.penalty) {
      console.log("player took penalty tile")
      messages.add(`Player ${players.active.get+1} took the penalty tile!`)
      players.list.get[players.active.get].floor.push({penalty: true})
      players.next.set(players.active.get)
      surplus.get.penalty = false
    }

    surplus.set(s => { return { ...s, tiles: rejected } })
    players.active.chooseTiles(chosen)
  }

  return (
    <div className="Surplus flex just-centered">
      <span className="centered">Surplus:</span>
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