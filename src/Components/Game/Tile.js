import React, { useContext } from 'react';
import { GameContext } from '.'

const TILE_COLORS = {
  blue: 'cyan',
  black: 'silver',
  brown: 'tan',
  green: 'lime',
  orange: 'yellow',
}
const TILE_ORDER = Object.keys(TILE_COLORS)
const TILE_POSITIONS = Object.fromEntries(TILE_ORDER.map((c, i) => [c, i]))
const TILE_PENALTIES = [-1, -1, -2, -2, -2, -3, -3]
const TILE_SIZE = 36
const TILE_BORDER = 3
const TILE_MARGIN = 4

const Tile = ({color, score, highlight=false, onClick=null, onMouseOver=null, onMouseOut=null}) => {
  const { action } = useContext(GameContext)

  return (
    <div className={`Tile ${highlight ? 'highlight' : ''}`} style={{
      order: TILE_POSITIONS[color],
      backgroundColor: color,
      borderColor: TILE_COLORS[color],
    }} {...{onClick, onMouseOver, onMouseOut}}>
      {action.get === 'scoring' ? score : ""}
    </div>
  )
}

const TileStyles = () => {
  return (
    <style type="text/css">{`
      .Tile {
        width: ${TILE_SIZE}px;
        height: ${TILE_SIZE}px;
        border-width: ${TILE_BORDER}px;
        margin: ${TILE_MARGIN}px;
      }

      .Showroom {
        width: ${TILE_SIZE*3.5}px;
        height: ${TILE_SIZE*3.5}px;
      }

      .Showroom > .Tiles {
        width: ${TILE_SIZE*3}px;
        height: ${TILE_SIZE*3}px;
        padding-left: ${TILE_SIZE/2}px;
        padding-top: ${TILE_SIZE/2}px;
      }

      .Hand {
        height: ${TILE_SIZE}px;
      }
    `}</style>
  )
}

const PlaceholderTile = ({color, match, pending}) => {
  const { action } = useContext(GameContext)
  const classes = [match && 'Match', pending && ['', 'Pending','Completed'][pending]].filter(i => action.get !== 'scoring' && i)

  return (
    <div className={`Tile PlaceholderTile ${classes.join(" ")}`} style={{
      backgroundColor: color,
      borderColor: TILE_COLORS[color],
    }}>
      {action.get !== 'scoring' && pending && (pending === 1 ? <>&#9744;</> : <>&#9745;</>)}
    </div>
  )
}

const SlotTile = ({penalty}) => {
  return (
    <div className="Tile SlotTile">{penalty}</div>
  )
}

const PenaltyTile = ({penalty=false}) => {
  return (
    <div className="Tile PenaltyTile flex just-centered">
      <span className="centered">{penalty && '-'}1</span>
    </div>
  )
}

const initializeTiles = ({colors, perColor}) => {
  let id = 0
  const tiles = Object.keys(colors).reduce((acc, color) => {
    for (let i = 0; i < perColor; i++) acc.push({ id: id++, color })
    return acc
  }, [])

  return shuffleTiles(tiles)
}

const shuffleTiles = (array) => {
  array = [...array]
  for (let i = array.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * i)
    if (j !== i) [ array[j], array[i] ] = [ array[i], array[j] ]
  }
  return array
}

const scoreTile = (wall, row, col) => {
  const left  = col > 0 && wall[row][col-1]
  const right = col < 4 && wall[row][col+1]

  const up   = row > 0 && wall[row-1][col]
  const down = row < 4 && wall[row+1][col]

  let score = 0
  const cells = []

  // console.log([row, col, left||right, up||down])

  if (left || right) {
    for (let i = col; i < 5; i++) {
      if (wall[row][i]) {
        score++
        cells.push([row, i])
      }
      else break
    }
    for (let i = col-1; i >= 0; i--) {
      if (wall[row][i]) {
        score++
        cells.push([row, i])
      }
      else break
    }
  }
  if (up || down) {
    for (let i = row; i < 5; i++) {
      if (wall[i][col]) {
        score++
        cells.push([i, col])
      }
      else break
    }
    for (let i = row-1; i >= 0; i--) {
      if (wall[i][col]) {
        score++
        cells.push([i, col])
      }
      else break
    }
  }
  if (!left && !right && !up && !down) {
    score = 1
    cells.push([row, col])
  }

  return { score, cells }
}

export default Tile
export {
  TileStyles, PlaceholderTile, PenaltyTile, SlotTile, initializeTiles, shuffleTiles, scoreTile,
  TILE_BORDER, TILE_MARGIN, TILE_SIZE, TILE_COLORS, TILE_ORDER, TILE_POSITIONS, TILE_PENALTIES,
}