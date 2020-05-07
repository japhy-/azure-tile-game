import React, { useState, useEffect, createContext, useContext } from 'react'
import { initializeTiles, scoreTile, TILE_COLORS, TILE_POSITIONS, TILE_ORDER, TILE_PENALTIES, TileStyles } from './Tile'
import { initializePlayers } from './Player'
import Factory, { initializeFactory } from './Factory'
import { OtherPlayers, ActivePlayer } from './Player'
import { ActionContext } from '../../utilities/ActionQueue'
import { forN } from '../../utilities/Functions'

const GameContext = createContext()
const delay = 1250

const Game = (playing) => {
  const addActions = useContext(ActionContext)

  const [ players, setPlayers ] = useState([])
  const [ activePlayer, setActivePlayer ] = useState(0)
  const [ tryColor, setTryColor ] = useState(null)
  const [ nextRoundFirst, setNextRoundFirst ] = useState(null)
  const [ roundOver, setRoundOver ] = useState(false)
  const [ gameover, setGameover ] = useState(false)

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
    
    setShowrooms(initializeFactory(nplayers))
    setSurplus({penalty: true, tiles: []})
    
    setRoundOver(false)
    setGameover(false)
    setRound(0)
    setInitialized(true)
  }

  const scoreSteps = {
    activatePlayer: ({player: p}) => {
      setActivePlayer(p.id)
    },
    scoreTile: ({player: p, row, position: i}) => {
      const tile = row[i]
      
      row.forEach((t, n) => n !== i && discardedTiles.push(t))
      p.wall[i][(TILE_POSITIONS[tile.color] - i + 5) % 5] = tile

      if (p.wall[i].filter(t => t).length === 5) setGameover(true)

      const { score, cells } = scoreTile(p.wall, i, (TILE_POSITIONS[tile.color] - i + 5) % 5)
      p.score += score

      cells.forEach(([r, c]) => p.wall[r][c].highlight = true)

      tile.round = round
      tile.score = `+${score}`
      p.table[i] = []
    },
    clearHighlight: ({player: p}) => {
      p.wall.forEach(r => r.forEach(c => c && (c.highlight = false)))
      return true
    },
    scoreFloor: ({player: p, tile: t, position: i}) => {
      if (t.id) discardedTiles.push(t)
      p.score += TILE_PENALTIES[i] || 0
      if (p.score < 0) p.score = 0
      p.floor[i] = {}
    },
    clearFloor: ({player: p}) => {
      p.floor = []
      return true
    },
    cleanUp: () => {
      setDiscardedTiles([...discardedTiles])
      return true
    },
    clearScore: () => {
      players.forEach(({wall}) => wall.forEach(r => r.forEach(c => c && c.score && (c.score = ''))))
      return true
    },
    nextRound: () => {
      players.forEach(({wall}) => wall.forEach(r => r.forEach(c => c && c.score && (c.score = ''))))
      setPlayers([...players])
      setRoundOver(true)
    },
    bonusRow: ({player: p, row: i}) => {
      console.log(`player ${p.id}: row ${i} gives +2`)
      p.wall[i].forEach(c => c.highlight = true)
      p.wall[i][4].score = '+2'
      p.score += 2
    },
    bonusCol: ({player: p, col: i}) => {
      console.log(`player ${p.id}: col ${i} gives +7`)
      p.wall.forEach(r => r[i].highlight = true)
      p.wall[0][i].score = '+7'
      p.score += 7
    },
    bonusColor: ({player: p, color: c, cells}) => {
      console.log(`player ${p.id}: color ${c} gives +10`)
      cells.forEach(t => t.highlight = true)
      cells[2].score = '+10'
      p.score += 10
    },
    declareWinner: () => {
      const [ winner ] = players.map(({id, score}) => ({ id, score })).sort((a, b) => b.score - a.score)
      players[winner.id].winner = true
      setActivePlayer(winner.id)
      setAction('gameOver')
      console.log(`player #${winner.id} wins with ${winner.score}`)
    },
  }

  const scoreRound = () => {
    setAction('scoring')

    const steps = []

    players.forEach(p => {
      steps.push({ step: 'activatePlayer', player: p })
      p.table.forEach((row, i) => row.length === i+1 && steps.push({ step: 'scoreTile', player: p, row, position: i }) && steps.push({ step: 'clearHighlight', player: p }))
      p.floor.forEach((t, i) => steps.push({ step: 'scoreFloor', player: p, tile: t, position: i }))
      steps.push({ step: 'clearFloor', player: p })
      steps.push({ step: 'clearScore' })
    })

    steps.push({ step: 'cleanUp' })
    steps.push({ step: 'nextRound' })

    takeStep(steps)
  }

  const scoreBonuses = () => {
    const steps = []

    // console.log("game over, calculating bonuses...")
    players.forEach(p => {
      const allCells = Array.prototype.concat(...p.wall)
      ;

      steps.push({ step: 'activatePlayer', player: p })

      forN(5).forEach(i => {
        if (p.wall[i].filter(t => t).length === 5) {
          steps.push({ step: 'bonusRow', player: p, row: i })
          steps.push({ step: 'clearHighlight', player: p })
        }
      })

      steps.push({ step: 'clearScore' })

      forN(5).forEach(i => {
        if (p.wall.filter(r => r[i]).length === 5) {
          steps.push({ step: 'bonusCol', player: p, col: i })
          steps.push({ step: 'clearHighlight', player: p })
        }
      })

      steps.push({ step: 'clearScore' })

      forN(5).forEach(i => {
        const cells = allCells.filter(t => t.color === TILE_ORDER[i])
        if (cells.length === 5) {
          steps.push({ step: 'bonusColor', player: p, color: TILE_ORDER[i], cells })
          steps.push({ step: 'clearHighlight', player: p })
        }
      })

      steps.push({ step: 'clearScore' })
    })

    steps.push({step: 'declareWinner'})

    takeStep(steps)
  }

  const takeStep = (steps) => {
    if (steps.length) {
      const { step, ...args } = steps.shift()
      console.log(step, args)
      const pause = !scoreSteps[step](args)
      setPlayers([...players])
      setTimeout(() => takeStep(steps), pause && delay)
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
      get: round, set: setRound,
      score: scoreRound,
    },
    newGame,
    over: { get: gameover, set: setGameover },
  }

  useEffect(() => {
    if (action === 'turnEnd') {
      if (game.factory.showrooms.areEmpty && game.factory.surplus.isEmpty) game.round.score(gameover)
      else addActions({key: 'nextPlayer', pause: 750, event: game.players.active.nextPlayer})
    }
  // eslint-disable-next-line
  }, [action])

  useEffect(() => {
    if (playing.code) game.newGame(playing)
  // eslint-disable-next-line
  }, [playing])

  useEffect(() => {
    if (roundOver) {
      if (gameover) {
        scoreBonuses()
      }
      else {
        setRoundOver(false)
        setActivePlayer(nextRoundFirst)
        setDistributing(true)
      }
    }
  // eslint-disable-next-line
  }, [roundOver])

  return initialized ? (
    <GameContext.Provider value={game}>
      <div className={`Game ${action}`}>
        <TileStyles/>
        <div className="CurrentPlayer">
          <Factory/>
          <ActivePlayer/>
        </div>
        <OtherPlayers/>
        {gameover && "Game Over!"}
      </div>
    </GameContext.Provider>
  ) : (
    <div>Building Game...</div>
  )
}

export default Game
export { GameContext }

/*

  const scoreRound_viaActionQueue = () => {
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

*/