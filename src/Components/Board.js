import React, { useState, useEffect } from 'react'

import Factory from './Factory'
import Player, { OtherPlayers } from './Player'
import { TILE_POSITIONS } from './Tile'

const Board = ({
  tiles, setTiles,
  discardedTiles, setDiscardedTiles,
  floors, setFloors,
  players, setPlayers,
  activePlayer, setActivePlayer,
  action, setAction
}) => {
  const [ placed, setPlaced ] = useState(null)
  const [ roundOver, setRoundOver ] = useState(false)
  const [ populate, setPopulate ] = useState(false)

  const placeTileFromHand = (row) => {
    setPlaced(row)
    const tile = players[activePlayer].hand.shift()
    players[activePlayer].table[row].push(tile)
    if (players[activePlayer].hand.length === 0) setAction('wait')
    setPlayers([...players])
  }

  const dropTile = () => {
    const tile = players[activePlayer].hand.shift()
    players[activePlayer].floor.push(tile)
    if (players[activePlayer].hand.length === 0) setAction('wait')
    setPlayers([...players])
  }

  const scoreRound = () => {
    setAction('scoring')

    players.forEach(p => {
      let penalty = 0
      p.floor.forEach((t, i) => {
        if (t.penalty) setActivePlayer(p.id)
        penalty += [-1, -1, -2, -2, -2, -3, -3][i] || 0
        if (t.id) discardedTiles.push(t)
        // p.floor[i] = null;
        // setPlayers([...players])
      })
      p.floor = []

      console.log(`player ${p.id} has a penalty of ${penalty}`)

      p.table.forEach((row, i) => {
        if (row.length === i+1) {
          const tile = row[i]
          row.forEach((t, n) => n !== i && discardedTiles.push(t))
          p.wall[i][(TILE_POSITIONS[tile.color] - i + 5) % 5] = tile
          const cells = scoreTile(p.wall, i, (TILE_POSITIONS[tile.color] - i + 5) % 5)
          console.log(`player ${p.id} gets ${cells} points added to their score of ${p.score} from row ${i}`)
          p.score += cells
          p.table[i] = []
          // setPlayers([...players])
        }
      })

      setDiscardedTiles([...discardedTiles])
      p.score += penalty
      if (p.score < 0) p.score = 0
    })

    setAction('draw')
    setRoundOver(false)
    setPlayers([...players])
    setPopulate(true)
  }

  const scoreTile = (wall, row, col) => {
    const left = col > 0 && wall[row][col-1]
    const right = col < 4 && wall[row][col+1]
    const horiz = left || right

    const up = row > 0 && wall[row-1][col]
    const down = row < 4 && wall[row+1][col]
    const vert = up || down

    let cells = 0

    if (horiz) {
      for (let i = col; i < 5; i++) {
        if (wall[row][i]) cells++
        else break
      }
      for (let i = col-1; i >= 0; i--) {
        if (wall[row][i]) cells++
        else break
      }
    }
    else if (vert) {
      for (let i = row; i < 5; i++) {
        if (wall[i][col]) cells++
        else break
      }
      for (let i = row-1; i >= 0; i--) {
        if (wall[i][col]) cells++
        else break
      }
    }
    else cells = 1

    return cells
  }

  const nextPlayer = () => {
    console.log('switching players')
    setPlaced(null)
    setTimeout(() => {
      setAction('draw')
      setActivePlayer((activePlayer+1) % players.length)
    }, 1000)
  }

  useEffect(() => {
    console.log(action, players[activePlayer].hand.length===0, roundOver)
    if (action === 'wait' && players[activePlayer].hand.length === 0) {
      if (roundOver) {
        scoreRound()
      }
      else {
        nextPlayer()
      }
    }
  }, [action, roundOver, players, activePlayer])
  
  return (
    <div className="Board">
      <div className="CurrentPlayer">
        <Factory {...{tiles, setTiles, floors, setFloors, discardedTiles, setDiscardedTiles, activePlayer, players, setPlayers, action, setAction, setRoundOver, populate, setPopulate}}/>
        <Player player={players[activePlayer]} isActivePlayer={true} action={action} placeTileFromHand={placeTileFromHand} dropTile={dropTile} placed={placed}/>
      </div>
      <OtherPlayers players={players} activePlayer={activePlayer}/>
    </div>
  )
}

export default Board