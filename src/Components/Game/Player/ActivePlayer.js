import React, { useState, useContext, createContext } from 'react'
import { GameContext } from '..'
import { Player } from '.'

export const ActivePlayerContext = createContext({})

export const ActivePlayer = () => {
  const { backup, players, action } = useContext(GameContext)
  const player = players.list.get[players.active.get]

  const [ placed, setPlaced ] = useState(null)

  const playTile = (row) => {
    backup.get.played.push(row)
    backup.set({...backup.get, setPlaced})

    if (row === -1) {
      player.floor.push(player.hand.shift())
    }
    else {
      setPlaced(row)
      player.table[row].push(player.hand.shift())
    }
    if (player.hand.length === 0) {
      setPlaced(null)
      players.list.set([...players.list.get])
      action.set('turnEnd')
    }
    else {
      players.list.set([...players.list.get])
    }
  }

  return player ? (
    <ActivePlayerContext.Provider value={{id: player.id, playTile: action.get === 'place' && playTile, placed}}>
      <div className="ActivePlayer">
        <Player player={player}/>
      </div>
    </ActivePlayerContext.Provider>
  ) : null
}
