import React, { useState, useContext, createContext } from 'react'
import Tile, { SlotTile, PenaltyTile, PlaceholderTile, TILE_ORDER, TILE_PENALTIES, TILE_SIZE, TILE_BORDER, TILE_MARGIN } from './Tile'
import { GameContext } from '.'
import { forN } from '../../utilities/Functions'

const PlayerContext = createContext()
const ActivePlayerContext = createContext({})

const Player = ({player}) => {
  const { players: { active } } = useContext(GameContext)

  return (
    <PlayerContext.Provider value={player}>
      <div className="Player flex columns just-centered centered">
        <h2>Player {player.id}{active.get === player.id && (<>: <ActionButton/></>)}</h2>
        {active.get === player.id && <Hand/>}
        <Workshop/>
        <div className="FloorScoreWrapper flex just-centered">
          <PlayerFloor/>
          <Score/>
        </div>
      </div>
    </PlayerContext.Provider>
  )
}

const ActivePlayer = () => {
  const { players, action } = useContext(GameContext)
  const player = players.list.get[players.active.get]

  const [ placed, setPlaced ] = useState(null)

  const playTile = (row) => {
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

  return (
    <ActivePlayerContext.Provider value={{id: player.id, playTile: action.get === 'place' && playTile, placed}}>
      <div className="ActivePlayer">
        <Player player={player}/>
      </div>
    </ActivePlayerContext.Provider>
  )
}

const OtherPlayers = () => {
  const { players } = useContext(GameContext)

  return (
    <div className="OtherPlayers flex columns grow-1">
      {players.list.get.filter(p => p.id !== players.active.get).map(p => (
        <Player key={`player-${p.id}`} player={p}/>
      ))}
    </div>
  )
}

const ActionButton = () => {
  const { action } = useContext(GameContext)

  const buttons = {
    draw: { label: 'Draw Tiles' },
    place: { label: 'Place Tiles'},
    turnEnd: { label: 'End Turn' },
    scoring: { label: 'Scoring' },
    gameOver: { label: 'Winner!' },
  }

  return action.get && (
    <b>{buttons[action.get].label}</b>
  )
}

const Hand = () => {
  const { players: { color } } = useContext(GameContext)
  const { hand: tiles } = useContext(PlayerContext)

  return (
    <div className="Hand flex">
      <b className="centered">Hand:</b>
      <div className="flex">
        {tiles.map(t => <Tile key={`tile-${t.id}`} color={t.color}
          onMouseOver={() => color.set(t.color)}
          onMouseOut={() => color.set(null)}
        />)}
      </div>
    </div>
  )
}

const Workshop = () => {
  return (
    <div className="Workshop flex columns just-centered centered">
      <h3>Workshop</h3>
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
  const { id: activeId } = useContext(ActivePlayerContext)
  const { id } = useContext(PlayerContext)

  const pending =
    list.get[id].table[row].length > 0
    && list.get[id].table[row][0].color === tile.color
    && (list.get[id].table[row].length === row+1 ? 2 : 1)

  return (
    <td className="WallCell">
      {tile.id > -1 ? <Tile score={tile.score} highlight={tile.highlight} color={tile.color} round={tile.round}/> : <PlaceholderTile color={tile.color} pending={pending} match={id === activeId && color.get === tile.color}/>}
    </td>
  )
}

const PlayerFloor = () => {
  const { playTile } = useContext(ActivePlayerContext)
  const { floor: tiles } = useContext(PlayerContext)

  const canDropTile =
    playTile

  return (
    <div className={`PlayerFloor flex ${canDropTile ? 'can-drop' : 'cannot-drop'}`} onClick={canDropTile ? () => playTile(-1) : null}>
      <b className="centered">Floor</b>
      <div className="PlayerFloorTiles flex">
        {forN(7).map(i => tiles[i]).map((t={}, i) => t.penalty ?
          <PenaltyTile key={`tile-penalty`} penalty={true}/> :
          (t.id ? <Tile key={`tile-${t.id}`} color={t.color} score={TILE_PENALTIES[i]} round={TILE_PENALTIES[i]}/> : <SlotTile key={`slot-${i}`} penalty={TILE_PENALTIES[i]} />)
        )}
      </div>
    </div>
  )
}

const Score = () => {
  const { score } = useContext(PlayerContext)

  return (
    <div className="Score flex columns just-centered">
      <b className="centered">Score</b>
      <div className="ScoreValue centered">{score}</div>
    </div>
  )
}

const initializePlayers = (n) => {
  const players = []
  for (let i = 0; i < n; i++) {
    players.push({id: i, hand: [], score: 0, table: [[],[],[],[],[]], wall: [[],[],[],[],[]], floor: []})
  }
  return players
}

export default Player
export { ActivePlayer, OtherPlayers, initializePlayers }