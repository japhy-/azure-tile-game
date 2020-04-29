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
const TILE_SIZE = 36
const TILE_BORDER = 3
const TILE_MARGIN = 4

const Tile = ({color, onClick=null}) => {
  return (
    <div className="Tile" style={{
      backgroundColor: color,
      width: `${TILE_SIZE}px`,
      height: `${TILE_SIZE}px`,
      border: `${TILE_BORDER}px ${TILE_COLORS[color]} outset`,
      margin: `${TILE_MARGIN}px`,
      // cursor: onClick ? 'grabbing' : 'not-allowed',
    }} {...{onClick}} />
  )
}

const PlaceholderTile = ({color}) => {
  return (
    <div className="Tile PlaceholderTile" style={{
      opacity: 0.25,
      backgroundColor: color,
      width: `${TILE_SIZE}px`,
      height: `${TILE_SIZE}px`,
      border: `${TILE_BORDER}px ${TILE_COLORS[color]} outset`,
      margin: `${TILE_MARGIN}px`,
    }} />
  )
}

const SlotTile = () => {
  return (
    <div className="Tile SlotTile" style={{
      width: `${TILE_SIZE}px`,
      height: `${TILE_SIZE}px`,
      borderWidth: `${TILE_BORDER}px`,
      margin: `${TILE_MARGIN}px`,
    }}/>
  )
}

const PenaltyTile = () => {
  return (
    <div className="Tile PenaltyTile" style={{
      width: `${TILE_SIZE}px`,
      height: `${TILE_SIZE}px`,
      borderColor: `${TILE_BORDER}px`,
      margin: `${TILE_MARGIN}px`,
    }}>
      <span>1</span>
    </div>
  )
}

const initializeTiles = ({colors, perColor}) => {
  let id = 0
  const tiles = Object.keys(colors).reduce((acc, color) => {
    for (let i = 0; i < perColor; i++) acc.push({ id: id++, color })
    return acc
  }, [])

  return shuffleFisherYates(tiles)
}

const shuffleFisherYates = (array) => {
  array = [...array]
  for (let i = array.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * i)
    if (j !== i) [ array[j], array[i] ] = [ array[i], array[j] ]
  }
  return array
}

export default Tile
export { initializeTiles, PlaceholderTile, PenaltyTile, SlotTile, TILE_BORDER, TILE_MARGIN, TILE_SIZE, TILE_COLORS, TILE_ORDER, TILE_POSITIONS }