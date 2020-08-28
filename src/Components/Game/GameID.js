import React from 'react'
import PropTypes from 'prop-types'

/**
 * Component for displaying the game ID.
 * 
 * @component
 */
const GameID = ({nplayers, code}) => {
  return (
    <div className="GameID flex just-centered">
      <h1>{nplayers}-Player Game of Azure-C (Code: {code.toUpperCase()})</h1>
    </div>
  )
}


GameID.propTypes = {
  /**
   * The number of players in the game.
   */
  nplayers: PropTypes.number.isRequired,

  /**
   * The game ID.
   */
  code: PropTypes.string.isRequired,
}

export default GameID