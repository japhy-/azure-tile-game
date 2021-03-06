import React, { useState, useEffect, createContext, useContext } from 'react'
import { initializeTiles, scoreTile, TILE_COLORS, TILE_POSITIONS, TILE_ORDER, TILE_PENALTIES } from './Tile'
import { TileStyles } from "./Tile/TileStyles"
import { initializePlayers } from './Player'
import Factory, { initializeFactory } from './Factory'
import { ActivePlayer } from './Player/ActivePlayer'
import { OtherPlayers } from "./Player/OtherPlayers"
import Messages from './Messages'
import GameID from './GameID'
import { ActionContext } from '../../utilities/ActionQueue'
import { forN } from '../../utilities/Functions'

export const GameContext = createContext()
const delay = 2000

export const Game = ({ host, nplayers, thiscomp, code, screenname}) => {
  const addActions = useContext(ActionContext)

  const [ players, setPlayers ] = useState([])
  const [ activePlayer, setActivePlayer ] = useState(null)
  const [ winningPlayer, setWinningPlayer ] = useState(null)
  const [ tryColor, setTryColor ] = useState(null)
  const [ nextRoundFirst, setNextRoundFirst ] = useState(null)
  const [ roundOver, setRoundOver ] = useState(false)
  const [ gameover, setGameover ] = useState(false)

  const [ baggedTiles, setBaggedTiles ] = useState([])
  const [ discardedTiles, setDiscardedTiles ] = useState([])

  const [ showrooms, setShowrooms ] = useState([])
  const [ surplus, setSurplus ] = useState({})

  const [ messages, setMessages ] = useState([])
  const addMessage = (msg) => setMessages(m => [msg, ...m].slice(0, 5))

  const [ action, setAction ] = useState(null)
  const [ initialized, setInitialized ] = useState(false)
  const [ distributing, setDistributing ] = useState(false)
  const [ round, setRound ] = useState(0)

  const [ backup, setBackup ] = useState({})
  const restoreBackup = () => {
    if (backup.id === undefined) return

    // empty the player's hand
    players[activePlayer].hand = []

    // remove tiles from wherever they've been played
    backup.played.forEach(row => backup.chosen.push((row === -1 ? players[activePlayer].floor : players[activePlayer].table[row]).pop()))

    if (backup.id === -1) {
      // restore tiles to the surplus
      surplus.tiles = [...backup.chosen, ...backup.rejected]

      // reset penalty tile
      if ((surplus.penalty = backup.penalty)) {
        players[activePlayer].floor.pop()
        setMessages(msgs => msgs.slice(1))
      }
    }

    else {
      // restore tiles to the showroom
      showrooms[backup.id].tiles = [...backup.chosen, ...backup.rejected]
      setShowrooms([...showrooms])
  
      // remove tiles from the surplus
      surplus.tiles.splice(-backup.rejected.length)
    }

    setSurplus({...surplus})  

    // clear "placed" state if it exists
    if (backup.setPlaced) backup.setPlaced(null)

    // update players
    setPlayers([...players])

    // reset the action to 'draw'
    setAction('draw')
  }
  
  const chooseTiles = (tiles) => {
    players[activePlayer].hand = tiles
    setPlayers([...players])
  }

  const nextPlayer = () => {
    setActivePlayer(p => (p+1) % players.length)
    setAction('draw')
  }

  const newGame = () => {
    if (host) {
      setPlayers(initializePlayers(nplayers))
      
      setBaggedTiles(initializeTiles({colors: TILE_COLORS, perColor: 20}))
      setDiscardedTiles([])
      
      setShowrooms(initializeFactory(nplayers))
      setSurplus({penalty: true, tiles: []})
    
      setBackup({})
      setRoundOver(false)
      setGameover(false)
      setRound(0)
      
      setActivePlayer(0)
      setWinningPlayer(-1)

      setInitialized(true)
    }
    else {
    }
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
      p.score.thisRound += score

      addMessage(`Player ${p.id+1} scores ${score} point(s) from the ${tile.color} tile in row ${i+1}, for a total of ${p.score.thisRound}`)

      cells.forEach(([r, c]) => p.wall[r][c].highlight = true)

      tile.round = round
      tile.score = `+${score}`
      p.table[i] = []

      const [ winner ] = players.map(({id, score}) => ({ id, score })).sort((a, b) => (b.score.total + b.score.thisRound) - (a.score.total + a.score.thisRound))
      setWinningPlayer(winner.id)
    },
    clearHighlight: ({player: p}) => {
      p.wall.forEach(r => r.forEach(c => c && (c.highlight = false)))
      return true
    },
    scoreFloor: ({player: p, tile: t, position: i}) => {
      if (t.id) discardedTiles.push(t)
      p.score.thisRound += TILE_PENALTIES[i] || 0
      p.floor[i] = {}

      addMessage(`Player ${p.id+1} loses ${-TILE_PENALTIES[i]} point(s) from a wasted tile, for a total of ${p.score.thisRound}`)

      const [ winner ] = players.map(({id, score}) => ({ id, score })).sort((a, b) => (b.score.total + b.score.thisRound) - (a.score.total + a.score.thisRound))
      setWinningPlayer(winner.id)
    },
    clearFloor: ({player: p}) => {
      p.floor = []
      return true
    },
    cleanUp: () => {
      setDiscardedTiles([...discardedTiles])
      return true
    },
    clearScores: () => {
      players.forEach(({wall}) => wall.forEach(r => r.forEach(c => c && c.score && (c.score = ''))))
      players.forEach(p => {
        p.score.total += p.score.thisRound
        if (p.score.total < 0) p.score.total = 0
        p.score.thisRound = 0
      })
      return true
    },
    nextRound: () => {
      players.forEach(({wall}) => wall.forEach(r => r.forEach(c => c && c.score && (c.score = ''))))
      // setMessages([])
      setPlayers([...players])
      setRoundOver(true)
    },
    bonusRow: ({player: p, row: i}) => {
      console.log(`player ${p.id}: row ${i} gives +2`)
      p.wall[i].forEach(c => c.highlight = true)
      p.wall[i][4].score = '+2'
      p.score.thisRound += 2

      addMessage(`Player ${p.id+1} gets a 2-point bonus from complete row ${i+1}, for a total of ${p.score.thisRound}`)

      const [ winner ] = players.map(({id, score}) => ({ id, score })).sort((a, b) => (b.score.total + b.score.thisRound) - (a.score.total + a.score.thisRound))
      setWinningPlayer(winner.id)
    },
    bonusCol: ({player: p, col: i}) => {
      console.log(`player ${p.id}: col ${i} gives +7`)
      p.wall.forEach(r => r[i].highlight = true)
      p.wall[0][i].score = '+7'
      p.score.thisRound += 7

      addMessage(`Player ${p.id+1} gets a 7-point bonus from complete column ${i+1}, for a total of ${p.score.thisRound}`)

      const [ winner ] = players.map(({id, score}) => ({ id, score })).sort((a, b) => (b.score.total + b.score.thisRound) - (a.score.total + a.score.thisRound))
      setWinningPlayer(winner.id)
    },
    bonusColor: ({player: p, color: c, cells}) => {
      console.log(`player ${p.id}: color ${c} gives +10`)
      cells.forEach(t => t.highlight = true)
      cells[2].score = '+10'
      p.score.thisRound += 10

      addMessage(`Player ${p.id+1} gets a 10-point bonus for having all five ${c} tiles, for a total of ${p.score.thisRound}`)

      const [ winner ] = players.map(({id, score}) => ({ id, score })).sort((a, b) => (b.score.total + b.score.thisRound) - (a.score.total + a.score.thisRound))
      setWinningPlayer(winner.id)
    },
    declareWinner: () => {
      players.forEach(p => {
        p.score.total += p.score.thisRound
        p.score.thisRound = 0
      })

      const [ winner ] = players.map(({id, score}) => ({ id, score })).sort((a, b) => (b.score.total + b.score.thisRound) - (a.score.total + a.score.thisRound))

      addMessage(`Player ${winner.id+1} wins with ${winner.score.total} points!`)

      setWinningPlayer(winner.id)
      setActivePlayer(winner.id)
      setAction('gameOver')
      console.log(`player #${winner.id} wins with ${winner.score.total}`)
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
    })

    steps.push({ step: 'clearScores' })
    steps.push({ step: 'cleanUp' })
    steps.push({ step: 'nextRound' })

    takeStep(steps)
  }

  const scoreBonuses = () => {
    const steps = []

    // console.log("game over, calculating bonuses...")
    players.forEach(p => {
      const allCells = Array.prototype.concat(...p.wall)

      steps.push({ step: 'activatePlayer', player: p })

      let bonus = false
      forN(5).forEach(i => {
        if (p.wall[i].filter(t => t).length === 5) {
          steps.push({ step: 'bonusRow', player: p, row: i })
          bonus = true
        }
      })
      if (bonus) steps.push({ step: 'clearHighlight', player: p })

      bonus = false
      forN(5).forEach(i => {
        if (p.wall.filter(r => r[i]).length === 5) {
          steps.push({ step: 'bonusCol', player: p, col: i })
          bonus = true
        }
      })
      if (bonus) steps.push({ step: 'clearHighlight', player: p })

      bonus = false
      forN(5).forEach(i => {
        const cells = allCells.filter(t => t.color === TILE_ORDER[i])
        if (cells.length === 5) {
          steps.push({ step: 'bonusColor', player: p, color: TILE_ORDER[i], cells })
          bonus = true
        }
      })
      if (bonus) steps.push({ step: 'clearHighlight', player: p })

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
      winner: { get: winningPlayer, set: setWinningPlayer },
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
    messages: { get: messages, set: setMessages, add: addMessage },
    action: { get: action, set: setAction },
    initialized: { get: initialized, set: setInitialized },
    round: {
      get: round, set: setRound,
      score: scoreRound,
    },
    newGame,
    over: { get: gameover, set: setGameover },
    backup: { 
      get: backup, set: setBackup, undo: restoreBackup
    }
  }

  useEffect(() => {
    if (action === 'turnEnd') {
      if (game.factory.showrooms.areEmpty && game.factory.surplus.isEmpty) game.round.score(gameover)
      else addActions({key: 'nextPlayer', pause: 750, event: game.players.active.nextPlayer})
    }
    // eslint-disable-next-line
  }, [action])

  useEffect(() => {
    if (gameover) addMessage("Game will end when this round is over!")
  }, [gameover])

  useEffect(() => {
    if (code) {
      if (host) game.newGame()
      // else game.readGame()
    }
    // eslint-disable-next-line
  }, [code])

  useEffect(() => {
    setBackup({})
  }, [activePlayer])

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
      <div className={`Game flex columns grow-1 ${action} ${gameover && 'gameover'}`}>
        <TileStyles/>
        <GameID {...{nplayers, code}}/>
        <div className="flex rows">
          <div className="CurrentPlayer flex columns grow-1">
            <Factory/>
            <ActivePlayer/>
            <Messages/>
          </div>
          <OtherPlayers/>
        </div>
      </div>
    </GameContext.Provider>
  ) : (
    <div>Building Game...</div>
  )
}

export default Game

// import { StitchContext, useStitchWatcher } from '../../utilities/Stitch'
  // const stitch = useContext(StitchContext)

  /*
  const state = {
    players: {
      list: { get: players },
      active: { get: activePlayer  },
      winner: { get: winningPlayer },
      next: { get: nextRoundFirst },
      color: { get: tryColor },
    },
    tiles: {
      bag: { get: baggedTiles },
      discard: { get: discardedTiles },
    },
    factory: {
      showrooms: { get: showrooms },
      distributing: { get: distributing },
      surplus: { get: surplus },
    },
    action: { get: action },
    initialized: { get: initialized },
    round: { get: round },
    over: { get: gameover },
    backup: { get: backup },
  }
  */

  /*
  const { watching, setActive: setWatcherActive } = useStitchWatcher({collection: 'azure', filter: { code }, onNext: (ev) => {
    if (ev.fullDocument.screenname === screenname) return

    console.log(ev)
  }})
  */

  /*
  useEffect(() => {
    console.log('rendering...')

    // if (myTurn) stitch.game.updateOne({code}, {$set: { screenname, state }})

    // eslint-disable-next-line
  }, [players, activePlayer, winningPlayer])
  */


        /*
      await stitch.game.insertOne({_uid: stitch.user.id, _urw: true, code, nplayers, thiscomp, host: screenname, screenname, state: {}})
      setWatcherActive(true)
      */
      /*
      setWatcherActive(true)
      */
