import React from 'react'
import Tile, { SlotTile, PenaltyTile, PlaceholderTile, TILE_SIZE, TILE_ORDER } from './Tile'

const Player = ({player, isActivePlayer=false, action, placeTileFromHand, dropTile, placed}) => {
  return (
    <div className="Player">
      <h2>Player {player.id}: {action} [placed={placed}]</h2>
      {isActivePlayer && <Hand tiles={player.hand}/>}
      <Workshop table={player.table} wall={player.wall} action={action} hand={player.hand} placeTile={isActivePlayer && placeTileFromHand} placed={placed}/>
      <div className="FloorScoreWrapper">
        <PlayerFloor tiles={player.floor} action={action} dropTile={isActivePlayer && dropTile}/>
        <Score score={player.score}/>
      </div>
    </div>
  )
}

const Hand = ({tiles}) => {
  return (
    <div className="Hand" style={{height: `${TILE_SIZE}px`}}>
      <b>Hand:</b>
      <div>
        {tiles.map(t => <Tile key={`tile-${t.id}`} color={t.color}/>)}
      </div>
    </div>
  )
}

const Workshop = ({table, wall, action, hand, placeTile, placed}) => {
  return (
    <div className="Workshop">
      <h3>Workshop</h3>
      <div>
      <TileTable table={table} action={action} hand={hand} placeTile={placeTile} placed={placed} wall={wall}/>
      <Arrows/>
      <Wall wall={wall}/>
      </div>
    </div>
  )
}

const TileTable = ({table, action, placeTile, placed, hand, wall}) => {
  return (
    <div className="TileTable">
      <b>Table</b>
      <table>
        <tbody>
          {[...Array(5).keys()].map(i => 
            <TileTableRow key={`tiletablerow-${i}`} row={i} tiles={table[i]} action={action} hand={hand} placeTile={placeTile} placed={placed} wall={wall}/>
          )}
        </tbody>
      </table>
    </div>
  )
}

const TileTableRow = ({row, tiles, action, hand, placeTile, placed, wall}) => {
  const blanks = 4 - row
  const canPlaceTile =
    placeTile
    && action === 'place'
    && (placed === null || placed === row)
    && hand.length
    && (tiles.length === 0 || (tiles[0].color === hand[0].color && tiles.length < row+1))
    && wall[row].filter(t => t.color === hand[0].color).length === 0

  return (
    <tr className="TileTableRow" style={{cursor: canPlaceTile ? 'grab' : 'not-allowed'}} onClick={canPlaceTile ? () => placeTile(row) : null}>
      {[...Array(blanks).keys()].map(i => 
        <TileTableCell key={`tiletablecell-${row}-${i}`} blank={true}/>
      )}
      {[...Array(row+1).keys()].map(i => 
        <TileTableCell key={`tiletablecell-${row}-${blanks+i}`} blank={false} tile={tiles[i]}/>
      )}
    </tr>
  )
}

const TileTableCell = ({blank, tile=null}) => {
  return (
    <td className="TileTableCell">
      {blank ? "" : (tile ? <Tile color={tile.color}/> : <SlotTile/> )}
    </td>
  )
}

const Arrows = () => {
  return (
    <div className="Arrows">
      <br/>
      <table>
        <tbody>
          {[...Array(5).keys()].map(i => 
            <tr key={`arrows-${i}`}><td>&gt;</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const Wall = ({wall}) => {
  return (
    <div className="Wall">
      <b>Wall</b>
      <table>
        <tbody>
          {[...Array(5).keys()].map(i => 
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
      {[...Array(5).keys()].map(i => 
        <WallCell key={`wallcell-${row}-${i}`} tile={tiles[i] || {color: TILE_ORDER[(row+i)%5]}}/>
      )}
    </tr>
  )
}

const WallCell = ({tile=null}) => {
  return (
    <td className="WallCell">
      {tile.id ? <Tile color={tile.color}/> : <PlaceholderTile color={tile.color}/>}
    </td>
  )
}

const PlayerFloor = ({tiles, action, dropTile}) => {
  const canDropTile =
    dropTile
    && action === 'place'

  return (
    <div className="PlayerFloor" style={{cursor: canDropTile ? 'cursor' : 'not-allowed'}} onClick={canDropTile ? () => dropTile() : null}>
      <b>Floor:</b>
      <div className="PlayerFloorTiles">
        {[...Array(7).keys()].map(i => tiles[i]).map((t={}, i) => t.penalty ? <PenaltyTile key={`tile-penalty`}/> : (t.id ? <Tile key={`tile-${t.id}`} color={t.color}/> : <SlotTile key={`slot-${i}`} />))}
      </div>
    </div>
  )
}

const Score = ({score}) => {
  return (
    <div className="Score">
      <b>Score:</b>
      <div className="ScoreValue">{score}</div>
    </div>
  )
}

const OtherPlayers = ({players, activePlayer}) => {
  return (
    <div className="OtherPlayers">
      {players.map(p => p.id !== activePlayer && <Player key={`player-${p.id}`} player={p} isActivePlayer={false}/>)}
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
export { OtherPlayers, initializePlayers }