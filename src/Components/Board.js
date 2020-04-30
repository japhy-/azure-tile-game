import React from 'react'

import Factory from './Factory'
import { OtherPlayers, ActivePlayer } from './Player'

const Board = () => {
  return (
    <div className="Board">
      <div className="CurrentPlayer">
        <Factory/>
        <ActivePlayer/>
      </div>
      <OtherPlayers/>
    </div>
  )
}

export default Board