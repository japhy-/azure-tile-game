import React, { useContext } from 'react'
import { GameContext } from '..'

export const TILE_COLORS = {
  blue: 'cyan',
  black: 'silver',
  maroon: 'tan',
  green: 'lime',
  orange: 'yellow',
}
export const TILE_ORDER = Object.keys(TILE_COLORS)
export const TILE_POSITIONS = Object.fromEntries(TILE_ORDER.map((c, i) => [c, i]))
export const TILE_PENALTIES = [-1, -1, -2, -2, -2, -3, -3]
export const TILE_SIZE = 36
export const TILE_BORDER = 3
export const TILE_MARGIN = 4

export const Tile = ({color, score, highlight=false, onClick=null, onMouseOver=null, onMouseOut=null}) => {
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

export const initializeTiles = ({colors, perColor}) => {
  let id = 0
  const tiles = Object.keys(colors).reduce((acc, color) => {
    for (let i = 0; i < perColor; i++) acc.push({ id: ++id, color })
    return acc
  }, [])

  return shuffleTiles(tiles)
}

export const shuffleTiles = (array) => {
  array = [...array]
  for (let i = array.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * i)
    if (j !== i) [ array[j], array[i] ] = [ array[i], array[j] ]
  }
  return array
}

export const scoreTile = (wall, row, col) => {
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