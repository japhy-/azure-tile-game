import React, { useContext } from 'react'
import { GameContext } from '..'
import { TILE_COLORS } from '.'

export const PlaceholderTile = ({ color, match, pending }) => {
  const { action } = useContext(GameContext)
  const classes = [match && 'Match', pending && ['', 'Pending', 'Completed'][pending]].filter(i => action.get !== 'scoring' && i)

  return (
    <div className={`Tile PlaceholderTile ${classes.join(" ")}`} style={{
      backgroundColor: color,
      borderColor: TILE_COLORS[color],
    }}>
      {action.get !== 'scoring' && pending && (pending === 1 ? <>&#9744;</> : <>&#9745;</>)}
    </div>
  )
}

export default PlaceholderTile