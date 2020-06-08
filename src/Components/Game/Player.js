import React, { useState, useContext, createContext, useEffect } from 'react'
import Tile, { SlotTile, PenaltyTile, PlaceholderTile, TILE_ORDER, TILE_PENALTIES, TILE_SIZE, TILE_BORDER, TILE_MARGIN } from './Tile'
import { GameContext } from '.'
import { forN } from '../../utilities/Functions'

const PlayerContext = createContext()
const ActivePlayerContext = createContext({})

const Player = ({player, stub}) => {
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

const UndoButton = () => {
  const { backup: { undo } } = useContext(GameContext)
  return (
    <button onClick={undo} style={{order: 100}}>Start Over</button>
  )
}

const ActivePlayer = () => {
  const { backup, players, action } = useContext(GameContext)
  const player = players.list.get[players.active.get]

  const [ placed, setPlaced ] = useState(null)

  const playTile = (row) => {
    backup.get.played.push(row)
    backup.set({...backup.get, setPlaced})

    if (row === -1) {
      player.floor.push(player.hand.shift())
    }
    else {
      setPlaced(row)
      player.table[row].push(player.hand.shift())
    }
    if (player.hand.length === 0) {
      setPlaced(null)
      players.list.set([...players.list.get])
      action.set('turnEnd')
    }
    else {
      players.list.set([...players.list.get])
    }
  }

  return player ? (
    <ActivePlayerContext.Provider value={{id: player.id, playTile: action.get === 'place' && playTile, placed}}>
      <div className="ActivePlayer">
        <Player player={player}/>
      </div>
    </ActivePlayerContext.Provider>
  ) : null
}

const OtherPlayers = () => {
  const { players } = useContext(GameContext)

  return (
    <div className="OtherPlayers flex columns">
      {players.list.get.map(p => (
        <Player key={`player-${p.id}`} player={p} stub={p.id === players.active.get}/>
      ))}
    </div>
  )
}

const CurrentAction = () => {
  const { action } = useContext(GameContext)

  const text = {
    draw: 'Draw Tiles',
    place: 'Place Tiles',
    turnEnd: 'End Turn',
    scoring: 'Scoring',
    gameOver: 'Winner!',
  }

  return action.get && (<b>{text[action.get]}</b>)
}

const Hand = () => {
  const { action, players: { color } } = useContext(GameContext)
  const { hand: tiles } = useContext(PlayerContext)

  return (
    <div className="Hand flex just-centered">
      <b className="centered">Hand:</b>
      <div className="flex centered">
        {tiles.map(t => <Tile key={`tile-${t.id}`} color={t.color}
          onMouseOver={() => color.set(t.color)}
          onMouseOut={() => color.set(null)}
        />)}
        {action.get === 'place' && <UndoButton/>}
      </div>
    </div>
  )
}

const Workshop = () => {
  return (
    <div className="Workshop flex columns just-centered centered">
      <h3 className="centered">Workshop</h3>
      <div className="flex just-centered">
        <TileTable/>
        <Arrows/>
        <Wall/>
      </div>
    </div>
  )
}

const TileTable = () => {
  const { table } = useContext(PlayerContext)

  return (
    <div className="TileTable flex columns just-centered">
      <b className="centered">Table</b>
      <table>
        <tbody>
          {forN(5).map(i => 
            <TileTableRow key={`tiletablerow-${i}`} row={i} tiles={table[i]}/>
          )}
        </tbody>
      </table>
    </div>
  )
}

const TileTableRow = ({row, tiles}) => {
  const { action, players: { color } } = useContext(GameContext)
  const { playTile, placed } = useContext(ActivePlayerContext)
  const { wall, hand } = useContext(PlayerContext)

  const blanks = 4 - row

  const canPlaceTile =
    ((action.get === 'draw' && color.get) || (hand.length > 0 && playTile))
    && (placed === null || placed === row)
    && (tiles.length === 0 || (tiles[0].color === (action.get === 'draw' ? color.get : hand[0].color) && tiles.length < row+1))
    && wall[row].filter(t => t && t.color === (action.get === 'draw' ? color.get : hand[0].color)).length === 0

  return (
    <tr className={`TileTableRow ${canPlaceTile ? 'can-drop' : 'cannot-drop'}`} onClick={canPlaceTile ? () => playTile(row) : null}>
      {forN(blanks).map(i => 
        <TileTableCell key={`tiletablecell-${row}-${i}`} blank/>
      )}
      {forN(row+1).map(i => 
        <TileTableCell key={`tiletablecell-${row}-${blanks+i}`} tile={tiles[i]}/>
      )}
    </tr>
  )
}

const TileTableCell = ({blank=false, tile=null}) => {
  return (
    <td className="TileTableCell">
      {blank ? "" : (tile ? <Tile color={tile.color}/> : <SlotTile/> )}
    </td>
  )
}

const Arrows = () => {
  return (
    <div className="Arrows flex columns just-centered">
      <br/>
      <table>
        <tbody>
          {forN(5).map(i => 
            <tr style={{height: (TILE_SIZE + 2 * TILE_BORDER + TILE_MARGIN) + 'px'}} key={`arrows-${i}`}>
              <td>&#9654;</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const Wall = () => {
  const { wall } = useContext(PlayerContext)

  return (
    <div className="Wall flex columns just-centered">
      <b className="centered">Wall</b>
      <table>
        <tbody>
          {forN(5).map(i => 
            <WallRow key={`wallrow-${i}`} row={i} tiles={wall[i]} />
          )}
      </tbody>
      </table>
    </div>
  )
}

const WallRow = ({row, tiles}) => {
  return (
    <tr className="WallRow">
      {forN(5).map(i => 
        <WallCell key={`wallcell-${row}-${i}`} row={row} col={i} tile={tiles[i] || {color: TILE_ORDER[(row+i)%5]}}/>
      )}
    </tr>
  )
}

const WallCell = ({row, col, tile=null}) => {
  const { players: { list, color } } = useContext(GameContext)
  // const { id: activeId } = useContext(ActivePlayerContext)
  const { id } = useContext(PlayerContext)

  const pending =
    list.get[id].table[row].length > 0
    && list.get[id].table[row][0].color === tile.color
    && (list.get[id].table[row].length === row+1 ? 2 : 1)

  return (
    <td className="WallCell">
      {tile.id ? <Tile score={tile.score} highlight={tile.highlight} color={tile.color} round={tile.round}/> : <PlaceholderTile color={tile.color} pending={pending} match={/*id === activeId &&*/ color.get === tile.color}/>}
    </td>
  )
}

const PlayerFloor = () => {
  const { playTile } = useContext(ActivePlayerContext)
  const { floor: tiles } = useContext(PlayerContext)

  const canDropTile =
    playTile

  return (
    <div className={`PlayerFloor flex just-centered ${canDropTile ? 'can-drop' : 'cannot-drop'}`} onClick={canDropTile ? () => playTile(-1) : null}>
      <b className="centered">Floor</b>
      <div className="PlayerFloorTiles flex centered">
        {forN(7).map(i => tiles[i]).map((t={}, i) => t.penalty ?
          <PenaltyTile key={`tile-penalty`} penalty={true}/> :
          (t.id ? <Tile key={`tile-${t.id}`} color={t.color} score={TILE_PENALTIES[i]} round={TILE_PENALTIES[i]}/> : <SlotTile key={`slot-${i}`} penalty={TILE_PENALTIES[i]} />)
        )}
      </div>
    </div>
  )
}

const Score = ({ label, value }) => {
  return (
    <div className="Score flex columns just-centered">
      <b className="centered">{label}</b>
      <div className="ScoreValue centered">{value}</div>
    </div>
  )
}

const initializePlayers = (n) => {
  const players = []
  for (let i = 0; i < n; i++) {
    players.push({id: i, hand: [], score: { thisRound: 0, total: 0 }, table: [[],[],[],[],[]], wall: [[],[],[],[],[]], floor: []})
  }
  return players
}

export default Player
export { ActivePlayer, OtherPlayers, initializePlayers }