import React, { useContext } from 'react'
import { GameContext } from '../'

export const UndoButton = () => {
  const { backup: { undo } } = useContext(GameContext)
  return (
    <button onClick={undo} style={{order: 100}}>Start Over</button>
  )
}

export default UndoButton