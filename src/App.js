import React, { useState, useEffect, createContext } from 'react'
import Board from './Components/Board'
import { initializeTiles, TILE_COLORS } from './Components/Tile'
import { initializePlayers } from './Components/Player'

import './App.css'

const GameContext = createContext()

const App = () => {
  const [ gameReady, setGameReady ] = useState(false)
  const [ players, setPlayers ] = useState([])
  const [ activePlayer, setActivePlayer ] = useState()
  const [ tiles, setTiles ] = useState([])
  const [ discardedTiles, setDiscardedTiles ] = useState([])
  const [ floors, setFloors ] = useState([])
  const [ action, setAction ] = useState(null)

  const startGame = () => {
    setTiles(initializeTiles({colors: TILE_COLORS, perColor: 10}))
    setDiscardedTiles([])
    setPlayers(initializePlayers(2))
    setAction('draw')
    setActivePlayer(0)
  }

  useEffect(() => {
    if (! gameReady && players.length) {
      setFloors(initializeFloors(players.length))
      setGameReady(true)
    }
  }, [gameReady, players.length])
  
  useEffect(() => {
    startGame()
  }, [])

  return (
    <div className="App">
      {gameReady && <Board {...{
        tiles, setTiles,
        discardedTiles, setDiscardedTiles,
        floors, setFloors,
        players, setPlayers,
        activePlayer, setActivePlayer,
        action, setAction
      }} />}
    </div>
  )
}


const initializeFloors = (nplayers) => {
  const floors = []
  for (let i = 0; i < nplayers * 2 - 1; i++) floors.push({id: i, tiles: []})
  return floors
}

export default App
