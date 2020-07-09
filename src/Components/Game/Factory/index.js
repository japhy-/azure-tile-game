import React, { useEffect, useContext } from 'react'
import Showroom from './Showroom'
import Surplus from './Surplus'
import { shuffleTiles } from '../Tile'
import { GameContext } from '../'
import { forN } from '../../../utilities/Functions'

const Factory = () => {
  const { messages, action, players, initialized, factory: { showrooms, surplus, distributing }, tiles, round } = useContext(GameContext)

  const distributeTiles = () => {
    distributing.set(false)

    if (players.winner.get > -1) messages.add(`Player ${players.winner.get+1} is leading with ${players.list.get[players.winner.get].score.total} points`)
    messages.add(`Round ${round.get+1}`)
    round.set(r => r+1)

    const tilesNeeded = 4 * showrooms.get.length
    
    // console.log(`${tilesNeeded} tiles needed for ${showrooms.get.length} floors`)
    const tilesToDistribute = tiles.bag.get.splice(0, tilesNeeded)

    if (tilesToDistribute.length < tilesNeeded) {
      // console.log(`distributed ${tilesToDistribute.length} tiles so far`)
      // console.log(`shuffling ${tiles.discard.get.length} discard tiles into the bag`)
      tiles.bag.get.push(...shuffleTiles(tiles.discard.get))
      // console.log(`there are now ${tiles.bag.get.length} tiles in the bag`)
      tiles.discard.set([])
      tilesToDistribute.push(...tiles.bag.get.splice(0, tilesNeeded - tilesToDistribute.length))
    }

    tiles.bag.set([...tiles.bag.get])

    showrooms.get.forEach((s, i) => {
      s.tiles = tilesToDistribute.slice(i*4, i*4+4)
    })

    showrooms.set([...showrooms.get])
    surplus.set({penalty: true, tiles: []})
    action.set('draw')
  }

  useEffect(() => {
    if (initialized.get) distributing.set(true)
  // eslint-disable-next-line
  }, [initialized.get])

  useEffect(() => {
    if (distributing.get) distributeTiles()
  // eslint-disable-next-line
  }, [distributing.get])
  
  return (
    <div className="Factory flex columns just-centered">
      <div className="Showrooms flex just-centered">
        {showrooms.get.map(s => <Showroom key={`showroom-${s.id}`} showroom={s}/>)}
      </div>
      <Surplus/>
      {false && (<div>
        <div>Game Round {round.get}</div>
        <div>Current Game State: {action.get}</div>
        <div>Current Active Player: {players.active.get}</div>
        <div>All Showrooms Empty: {showrooms.areEmpty ? 'Y' : 'N'}</div>
        <div>Surplus Is Empty: {surplus.isEmpty ? 'Y' : 'N'}</div>
      </div>)}
    </div>
  )
}


const initializeFactory = (nplayers) => forN(0, nplayers*2).map(id => ({id, tiles: []}))

export default Factory
export { initializeFactory }