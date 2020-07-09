import React from 'react'

export const PenaltyTile = ({ penalty = false }) => {
  return (
    <div className="Tile PenaltyTile flex just-centered">
      <span className="centered">{penalty && '-'}1</span>
    </div>
  )
}

export default PenaltyTile