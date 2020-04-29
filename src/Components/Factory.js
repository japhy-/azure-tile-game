import React, { useEffect, useState } from 'react'
import FactoryFloor from './FactoryFloor'
import Surplus from './Surplus'
import Tile from './Tile'

const Factory = ({floors, setFloors, tiles, setTiles, discardedTiles, setDiscardedTiles, activePlayer, action, setAction, players, setPlayers, setRoundOver, populate, setPopulate}) => {
  const [ factoryTiles, setFactoryTiles ] = useState([])
  const [ surplusTiles, setSurplusTiles ] = useState([])
  const [ penalty, setPenalty ] = useState(true)
  const [ emptyFloors, setEmptyFloors ] = useState(0)

  const drawTiles = () => {
    setPopulate(false)

    const tilesNeeded = 4 * floors.length - factoryTiles.length
    const tilesAvailable = tiles.length

    console.log(`${tilesNeeded} tiles needed for ${floors.length} floors, ${factoryTiles.length} tiles already distributed, ${tilesAvailable} tiles available`)

    if (tilesNeeded <= tilesAvailable) {
      console.log(`pulling ${tilesNeeded} tiles`)
      setFactoryTiles([...factoryTiles, ...tiles.slice(0, tilesNeeded)])
      setTiles(tiles.slice(tilesNeeded))
    }
    else {
      console.log(`pulling ${tiles.length} tiles, reshuffling ${discardedTiles.length} tiles`)
      setFactoryTiles([...tiles])
      setTiles([...discardedTiles])
      setDiscardedTiles([])
      setPopulate(true)
    }
  }

  const chooseTiles = (tiles) => {
    players[activePlayer].hand = tiles
    setPlayers([...players])
  }

  const distributeTiles = () => {
    floors.forEach((f, i) => {
      f.tiles = factoryTiles.slice(i*4, i*4+4).sort((a, b) => a.color.localeCompare(b.color))
    })
    setFactoryTiles([])
  }

  const takeSurplusTiles = (tile) => {
    setAction('place')
    const chosenTiles = []
    const remainingTiles = []
    surplusTiles.forEach(t => {
      (t.color === tile.color ? chosenTiles : remainingTiles).push(t)
    })
    console.log(`you selected ${chosenTiles.length} ${tile.color} tile(s) from the surplus`)
    console.log(`${remainingTiles.length} tiles remain in the surplus`)
    if (penalty) {
      takePenalty()
    }
    setSurplusTiles(remainingTiles)
    chooseTiles(chosenTiles)
  }

  const takePenalty = () => {
    players[activePlayer].floor.push({penalty: true})
    setPenalty(false)
  }

  useEffect(() => {
    if (factoryTiles.length === 4 * floors.length) {
      setEmptyFloors(0)
      distributeTiles()
    }
  }, [factoryTiles, floors])

  useEffect(() => {
    console.log(`populate = ${populate ? 'T' : 'F'}`)
    if (populate) {
      console.log('populating floors')
      setPenalty(true)
      drawTiles()
    }
  }, [populate])

  useEffect(() => {
    // console.log('setRoundOver?', action, emptyFloors, floors.length, surplusTiles.length, players[activePlayer].hand.length)
    if (action === 'wait' && emptyFloors === floors.length && surplusTiles.length === 0 && players[activePlayer].hand.length === 0) {
      setRoundOver(true)
    }
  }, [action, emptyFloors, surplusTiles, floors, players, activePlayer, setRoundOver]);

  useEffect(() => {
    setPopulate(true)
  }, [])

  return (
    <div className="Factory">
      <div className="FactoryFloors">
        {floors.map(f => 
          <FactoryFloor key={`floor-${f.id}`} floor={f} setSurplusTiles={setSurplusTiles} chooseTiles={chooseTiles} action={action} setAction={setAction} setEmptyFloors={setEmptyFloors}/>
        )}
      </div>
      <Surplus tiles={surplusTiles} takeSurplusTiles={takeSurplusTiles} penalty={penalty} action={action}/>
      <RemainingTiles tiles={tiles}/>
      <DiscardedTiles tiles={discardedTiles}/>
    </div>
  )
}


const RemainingTiles = ({tiles}) => {
  return (
    <div className="RemainingTiles">
      <b>RemainingTiles</b>
      {tiles.map(t => <Tile key={`tile-${t.id}`} color={t.color}/> )}
    </div>
  )
}


const DiscardedTiles = ({tiles}) => {
  return (
    <div className="DiscardedTiles">
      <b>DiscardedTiles</b>
      {tiles.map(t => <Tile key={`tile-${t.id}`} color={t.color} /> )}
    </div>
  )
}


export default Factory