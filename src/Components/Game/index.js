import React, { useState, useEffect, createContext, useContext } from 'react'
import { initializeTiles, scoreTile, TILE_COLORS, TILE_POSITIONS, TILE_ORDER, TILE_PENALTIES, TileStyles } from './Tile'
import { initializePlayers } from './Player'
import { initializeShowrooms } from './Showroom'
import Factory from './Factory'
import { OtherPlayers, ActivePlayer } from './Player'
import { ActionContext } from '../../utilities/ActionQueue'

const GameContext = createContext()

const Game = (playing) => {
  const addActions = useContext(ActionContext)

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
    const queue = []
    const initialState = JSON.parse(JSON.stringify(players))
    setActivePlayer(0)
    setPlayers(initialState)

    setAction('scoring')
    let gameOver = false
    const delay = 1000

    players.forEach(p => {
      p.table.forEach((row, i) => {
        if (row.length === i+1) {
          const tile = row[i]
          row.forEach((t, n) => n !== i && discardedTiles.push(t))
          tile.round = round;
          p.wall[i][(TILE_POSITIONS[tile.color] - i + 5) % 5] = tile
          if (p.wall[i].filter(t => t).length === 5) gameOver = true
          const { cells, lines } = scoreTile(p.wall, i, (TILE_POSITIONS[tile.color] - i + 5) % 5)
          // console.log(`player ${p.id}: +${cells} from row ${i}`)
          tile.score = `+${cells}`
          p.score += cells
          p.table[i] = []

          const state = JSON.parse(JSON.stringify(players))
          queue.push({key: `player-${p.id}-wall-${i}`, pause: delay, event: () => setPlayers(state)})
        }
      })

      p.floor.forEach((t, i) => {
        p.score += TILE_PENALTIES[i] || 0
        if (p.score < 0) p.score = 0

        if (t.id) discardedTiles.push(t)
        p.floor[i] = {}
        const state = JSON.parse(JSON.stringify(players))
        queue.push({key: `player-${p.id}-floor-${i}`, pause: delay, event: () => setPlayers(state)})
      })
      p.floor = []

      // console.log(`player ${p.id}: penalty = ${penalty}`)

      setDiscardedTiles([...discardedTiles])
      if (p.id+1 < players.length) queue.push({key: `player-${p.id+1}-active`, pause: delay, event: () => setActivePlayer(p.id+1)})
    })

    if (gameOver) {
      let winner = -1

      // console.log("game over, calculating bonuses...")
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
      queue.push({key: `game-over`, pause: delay, event: () => {
        setPlayers([...players])
      }})
      console.log(`player #${winner} wins with ${players[winner].score}`)
    }
    else {
      queue.push({key: `start-next-round`, pause: delay, event: () => {
        setPlayers([...players])
        setActivePlayer(nextRoundFirst)
        setDistributing(true)
      }})
    }

    addActions(queue)
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
    newGame,
  }

  useEffect(() => {
    if (action === 'turnEnd') {
      if (game.factory.showrooms.areEmpty && game.factory.surplus.isEmpty) scoreRound()
      else addActions({key: 'nextPlayer', pause: 750, event: game.players.active.nextPlayer})
    }
  // eslint-disable-next-line
  }, [action])

  /*
  useEffect(() => {
    if (action === 'draw' && game.factory.showrooms.areEmpty && game.factory.surplus.isEmpty) scoreRound()
  // eslint-disable-next-line
  }, [activePlayer, action])
  */

  useEffect(() => {
    if (playing.code) game.newGame(playing)
  // eslint-disable-next-line
  }, [playing])

  return initialized ? (
    <GameContext.Provider value={game}>
      <div className="Game">
        <TileStyles/>
        <div className="CurrentPlayer">
          <Factory/>
          <ActivePlayer/>
        </div>
        <OtherPlayers/>
      </div>
    </GameContext.Provider>
  ) : (
    <div>Building Game...</div>
  )
}

export default Game
export { GameContext }