import React, { useContext, createContext, useEffect } from 'react'
import { GameContext } from '../'
import { forN } from '../../../utilities/Functions'
import { CurrentAction } from './CurrentAction'
import { Hand } from './Hand'
import { Workshop } from './Workshop'
import { PlayerFloor } from './PlayerFloor'
import { Score } from './Score'
import { initializeWall } from './Wall'

export const PlayerContext = createContext()

export const Player = ({player, stub}) => {
  const { over, action, players: { active, winner } } = useContext(GameContext)

  useEffect(() => {
    if (!over.get && (action.get === 'place' || action.get === 'turnEnd')) forN(5).forEach(n => {
      if (player.table[n].filter(t => t.id).length === (n+1) && player.wall[n].filter(t => t.id).length === 4) {
        console.log(`${player.id+1} row ${n+1} signals game over`)
        over.set(true)
      }
    })
    // eslint-disable-next-line
  }, [over.get, player.table, player.wall, player.id, action.get])

  return (
    <PlayerContext.Provider value={player}>
      <div className={`Player flex columns just-centered centered ${winner.get === player.id && 'winning'}`}>
        {stub ? (<>
          <h2 className="centered">&#9664; [{player.score.total + player.score.thisRound} pts] Player {1+player.id}</h2>
        </>) : (<>
          <h2 className="centered">
            [{player.score.total + player.score.thisRound} pts] Player {1+player.id}
            {active.get === player.id && (<>: <CurrentAction/></>)}
          </h2>
          {active.get === player.id && <Hand/>}
          <Workshop/>
          <div className="FloorScoreWrapper flex just-centered">
            <PlayerFloor/>
            <Score label="This Round" value={player.score.thisRound}/>
            <Score label="Total" value={player.score.total}/>
          </div>
        </>)}
      </div>
    </PlayerContext.Provider>
  )
}

const initializePlayers = (n) => {
  const players = []
  for (let i = 0; i < n; i++) {
    players.push({id: i, hand: [], score: { thisRound: 0, total: 0 }, table: [[],[],[],[],[]], wall: initializeWall(), floor: []})
  }
  return players
}

export default Player
export { initializePlayers }