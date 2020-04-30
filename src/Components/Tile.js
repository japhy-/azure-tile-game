import React from 'react';

const TILE_COLORS = {
  blue: 'cyan',
  black: 'silver',
  purple: 'magenta',
  green: 'lime',
  yellow: 'orange',
}
const TILE_ORDER = Object.keys(TILE_COLORS)
const TILE_POSITIONS = Object.fromEntries(TILE_ORDER.map((c, i) => [c, i]))
const TILE_PENALTIES = [-1, -1, -2, -2, -2, -3, -3]
const TILE_SIZE = 36
const TILE_BORDER = 3
const TILE_MARGIN = 4

const Tile = ({color, round, onClick=null, onMouseOver=null, onMouseOut=null}) => {
  return (
    <div className="Tile" style={{
      order: TILE_POSITIONS[color],
      backgroundColor: color,
      borderColor: TILE_COLORS[color],
    }} {...{onClick, onMouseOver, onMouseOut}}>
      {round || ""}
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

const PlaceholderTile = ({color}) => {
  return (
    <div className="Tile PlaceholderTile" style={{
      backgroundColor: color,
      borderColor: TILE_COLORS[color],
    }} />
  )
}

const SlotTile = ({penalty}) => {
  return (
    <div className="Tile SlotTile">{penalty}</div>
  )
}

const PenaltyTile = ({penalty=false}) => {
  return (
    <div className="Tile PenaltyTile">
      <span>{penalty && '-'}1</span>
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

export default Tile
export {
  TileStyles, PlaceholderTile, PenaltyTile, SlotTile, initializeTiles, shuffleTiles, scoreTile,
  TILE_BORDER, TILE_MARGIN, TILE_SIZE, TILE_COLORS, TILE_ORDER, TILE_POSITIONS, TILE_PENALTIES,
}