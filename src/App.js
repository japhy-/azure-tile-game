import React, { useState, useEffect, createContext } from 'react'
import Board from './Components/Board'
import { initializeTiles, scoreTile, TILE_COLORS, TILE_POSITIONS, TILE_ORDER, TILE_PENALTIES, TileStyles } from './Components/Tile'
import { initializePlayers } from './Components/Player'
import { initializeShowrooms } from './Components/Showroom'

import './App.css'

const GameContext = createContext()

const App = () => {
  const [ players, setPlayers ] = useState([])
  const [ activePlayer, setActivePlayer ] = useState(0)
  const [ tryColor, setTryColor ] = useState(null)
  const [ nextRoundFirst, setNextRoundFirst ] = useState(null)

  const [ baggedTiles, setBaggedTiles ] = useState([])
  const [ discardedTiles, setDiscardedTiles ] = useState([])

  const [ showrooms, setShowrooms ] = useState([])
  const [ surplus, setSurplus ] = useState({})

  const [ action, setAction ] = useState(null)
  const [ initialized, setInitialized ] = useState(false)
  const [ distributing, setDistributing ] = useState(false)
  const [ round, setRound ] = useState(0)
  
  const chooseTiles = (tiles) => {
    players[activePlayer].hand = tiles
    setPlayers([...players])
  }

  const nextPlayer = () => {
    setActivePlayer(p => (p+1) % players.length)
    setAction('draw')
  }

  const newGame = ({nplayers=2, ntiles=20}) => {
    setPlayers(initializePlayers(nplayers))
    setActivePlayer(0)

    setBaggedTiles(initializeTiles({colors: TILE_COLORS, perColor: ntiles}))
    setDiscardedTiles([])

    setShowrooms(initializeShowrooms(nplayers))
    setSurplus({penalty: true, tiles: []})

    setRound(0)
    setInitialized(true)
  }

  const scoreRound = () => {
    setAction('scoring')
    let gameOver = false

    players.forEach(p => {
      let penalty = 0

      p.floor.forEach((t, i) => {
        penalty += TILE_PENALTIES[i] || 0
        if (t.id) discardedTiles.push(t)
      })
      p.floor = []

      console.log(`player ${p.id}: penalty = ${penalty}`)

      p.table.forEach((row, i) => {
        if (row.length === i+1) {
          const tile = row[i]
          row.forEach((t, n) => n !== i && discardedTiles.push(t))
          tile.round = round;
          p.wall[i][(TILE_POSITIONS[tile.color] - i + 5) % 5] = tile
          if (p.wall[i].filter(t => t).length === 5) gameOver = true
          const cells = scoreTile(p.wall, i, (TILE_POSITIONS[tile.color] - i + 5) % 5)
          console.log(`player ${p.id}: +${cells} from row ${i}`)
          p.score += cells
          p.table[i] = []
        }
      })

      setDiscardedTiles([...discardedTiles])
      p.score += penalty
      if (p.score < 0) p.score = 0
    })

    if (gameOver) {
      let winner = -1

      console.log("game over, calculating bonuses...")
      players.forEach(p => {
        let bonus = 0
        const allCells = Array.prototype.concat(...p.wall)
        ;
        [...Array(5).keys()].forEach(i => {
          if (p.wall[i].filter(t => t).length === 5) {
            console.log(`player ${p.id}: row ${i} gives +2`)
            bonus += 2
          }
          if (p.wall.filter(r => r[i]).length === 5) {
            console.log(`player ${p.id}: col ${i} gives +7`)
            bonus += 7
          }
          if (allCells.filter(t => t.color === TILE_ORDER[i]).length === 5) {
            console.log(`player ${p.id}: color ${TILE_ORDER[i]} gives +10`)
            bonus += 10
          }
        })

        p.score += bonus
        if (winner === -1 || p.score > players[winner].score) winner = p.id
      })
      players[winner].winner = true
      setPlayers([...players])
      console.log(`player #${winner} wins with ${players[winner].score}`)
    }
    else {
      setPlayers([...players])
      setActivePlayer(nextRoundFirst)
      setDistributing(true)
    }
  }

  const game = {
    players: {
      list: { get: players, set: setPlayers },
      active: { get: activePlayer, set: setActivePlayer, chooseTiles, nextPlayer },
      next: { get: nextRoundFirst, set: setNextRoundFirst },
      color: { get: tryColor, set: setTryColor },
    },
    tiles: {
      bag: { get: baggedTiles, set: setBaggedTiles },
      discard: { get: discardedTiles, set: setDiscardedTiles },
    },
    factory: {
      showrooms: { get: showrooms, set: setShowrooms, areEmpty: showrooms.filter(s => s.tiles.length > 0).length === 0 },
      distributing: { get: distributing, set: setDistributing },
      surplus: { get: surplus, set: setSurplus, isEmpty: !surplus.penalty && surplus.tiles && surplus.tiles.length === 0 },
    },
    action: { get: action, set: setAction },
    initialized: { get: initialized, set: setInitialized },
    round: {
      get: round, set: setRound, score: scoreRound,
    },
    game: { newGame },
  }

  useEffect(() => {
    newGame({})
  }, [])

  useEffect(() => {
    if (action === 'draw'
    && game.factory.showrooms.areEmpty
    && game.factory.surplus.isEmpty) {
      // console.log('round over, time to score')
      scoreRound()
    }
  }, [activePlayer])


  return (
    <div className="App">
      <TileStyles/>
      {initialized ? (
        <GameContext.Provider value={game}>
          <Board/>
        </GameContext.Provider>
      ) : (
        <NewGame play={newGame}/>
      )}
    </div>
  )
}

const NewGame = ({play}) => {
  const [ nplayers, setNplayers ] = useState(2)
  const [ ntiles, setNtiles ] = useState(20)

  return (
    <div>
      <div>
        How many players?
          <label><input type="radio" name="nplayers" value={2} defaultChecked onClick={(ev) => setNplayers(this.value)}/> 2</label>
          <label><input type="radio" name="nplayers" value={3} onClick={(ev) => setNplayers(this.value)}/> 3</label>
          <label><input type="radio" name="nplayers" value={4} onClick={(ev) => setNplayers(this.value)}/> 4</label>
      </div>
      <div>
        How many tiles per color?
          <input type="text" name="ntiles" defaultValue={20} onChange={(ev) => setNtiles(parseInt(this.value))}/>
      </div>
      <div>
        <button onClick={() => play({nplayers, ntiles})}>New Game</button>
      </div>
    </div>
  )
}


export default App
export { GameContext }
