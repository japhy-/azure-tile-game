import React from 'react'

const GameID = ({nplayers, code}) => {
  return (
    <div className="GameID flex just-centered">
      <h1>{nplayers}-Player Game of Azure (Code: {code.toUpperCase()})</h1>
    </div>
  )
}

export default GameID