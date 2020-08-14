import React, { useState, createContext, useContext, useEffect } from 'react'
import { Storage as StorageWrapper } from './utilities/Storage'
import './App.css'

const App = () => {
  return (
    <StorageWrapper method="local">
      <GameProvider>
        <Game/>
      </GameProvider>
    </StorageWrapper>
  )
}

export default App

const GameContext = createContext()

const Game = () => {
  const game = useContext(GameContext)
  const [ ready, setReady ] = useState(false)

  useEffect(() => {
    game.init()
    setReady(true)
    // eslint-disable-next-line
  }, [])

  if (! ready) return null

  return (
    <div className="Game" style={{display: 'flex', flexDirection: 'column'}}>
      <div className="top" style={{display: 'flex', flexDirection: 'row'}}>
        <Chain/>
        <WaysToWin/>
        <Owned/>
      </div>
      <div className="middle" style={{display: 'flex', flexDirection: 'row'}}>
        <Slots/>
        <div className="controls" style={{display: 'flex', flexDirection: 'column'}}>
          <Buttons/>
          <Spins/>
        </div>
      </div>
      <div className="bottom" style={{display: 'flex', flexDirection: 'column'}}>
        <Board/>
        <Winnings/>
      </div>
    </div>
  )
}

const Chain = () => {
  const { chain } = useContext(GameContext)
  const steps = chain === 0 ? [0, 0, 1] : [ chain-1, chain, chain+1 ]

  return (
    <div className="Chain" style={{display: 'flex', flexDirection: 'row'}}>
      {steps.map((s, idx) => <div key={idx}>{s}</div>)}
    </div>
  )
}

const WaysToWin = () => {
  const { slots } = useContext(GameContext)

  return (
    <div className="WaysToWin">
      Ways to Win: {slots.columns.reduce((p, c) => (p || 1) * (c.cells.length || 1), 0)}
    </div>
  )
}

const Owned = () => {
  return (
    <div className="Owned">
      [you own these utilities and railroads]
    </div>
  )
}

const Slots = () => {
  const { slots } = useContext(GameContext)

  return (
    <div className="Slots" style={{display: 'flex', flexDirection: 'row', borderRight: '1px solid black'}}>
      {slots.columns.map((s, idx) => <Slot key={idx} first={idx === 0} slot={s}/>)}
    </div>
  )
}

const Slot = ({first, slot}) => {
  return (
    <div className="Slot" style={{width: '60px', height: '210px', border: '1px solid black', borderRight: 'none', display: 'flex', flexDirection: 'column'}}>
      {slot.cells.map((cell, idx) => <div key={idx} style={{height: (210 / slot.cells.length) + 'px', border: '1px solid blue', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{cell[0]}</div>)}
    </div>
  )
}

const Buttons = () => {
  return (
    <div className="Buttons">
      (buttons)
    </div>
  )
}

const Spins = () => {
  return (
    <div className="Spins">
      (spins)
    </div>
  )
}

const Winnings = () => {
  const { credits, amountWon } = useContext(GameContext)

  return (
    <div className="Winnings">
      Credits: {credits}
      |
      Win: {amountWon.move} / {amountWon.spin} / {amountWon.total}
    </div>
  )
}

const Board = () => {
  return (
    <div className="Board">
      [a] [b] [c] [d] [e] [f]
    </div>
  )
}


const GameProvider = ({children}) => {
  // const storage = useContext(StorageContext)

  const [ credits, setCredits ] = useState()
  const [ amountWon, setAmountWon ] = useState()
  const [ chain, setChain ] = useState()
  const [ multiplier, setMultiplier ] = useState()
  const [ megaways, setMegaways ] = useState()
  const [ isBonus, setIsBonus ] = useState()
  const slots = useSlots(6)
  const [ spins, setSpins ] = useState()
  const board = useBoard()

  const init = () => {
    setCredits(1000)
    setAmountWon({move: 0, spin: 0, total: 0})
    setChain(0)
    setMultiplier(0)
    setMegaways(false)
    setIsBonus(false)
    slots.init() // setSlots([{cells: [], types: []}, {cells: [], types: []}, {cells: [], types: []}, {cells: [], types: []}, {cells: [], types: []}, {cells: [], types: []}])
    setSpins({ regular: { number: 0, spun: 0 }, bonus: { number: 0, spun: 0 } })
    board.init()
  }

  return (
    <GameContext.Provider value={{
      init,
      credits, setCredits,
      amountWon, setAmountWon,
      chain, setChain,
      multiplier, setMultiplier,
      megaways, setMegaways,
      isBonus, setIsBonus,
      slots,
      spins, setSpins,
      board
    }}>
      {children}
    </GameContext.Provider>
  )
}

const types = [
  [ '9', 10, 3, [ 0.1, 0.2, 0.3, 0.4 ] ],
  [ '10', 10, 3, [ 0.1, 0.2, 0.3, 0.4 ] ],
  [ 'J', 9, 3, [ 0.15, 0.25, 0.4, 0.5 ] ],
  [ 'Q', 9, 3, [ 0.15, 0.25, 0.4, 0.5 ] ],
  [ 'K', 8, 3, [ 0.2, 0.3, 0.5, 0.6 ] ],
  [ 'A', 8, 3, [ 0.2, 0.3, 0.5, 0.6 ] ],
  [ 'dog', 7, 3, [ 0.25, 0.4, 0.5, 0.9 ] ],
  [ 'car', 6, 3, [ 0.25, 0.5, 0.8, 1.5 ] ],
  [ 'boat', 5, 3, [ 0.4, 0.8, 1, 5 ] ],
  [ 'hat', 3, 2, [ 2, 5, 10, 20, 50 ] ],
  [ 'wild', 4, 7, [ ] ],
]

const typeMax = types.reduce((p, c) => p + c[1], 0)

const getCell = () => {
  const i = Math.floor(Math.random() * typeMax)
  let p = 0

  for (let j = 0; j < types.length; j++) {
    p += types[j][1]
    // console.log(i, p, j, types[j])
    if (i < p) return types[j]
  }
}

const useSlots = (count) => {
  const [ columns, setColumns ] = useState()
  const fillColumns = () => {
    const cols = []
    for (let i = 0; i < count; i++) {
      const col = []
      const types = {}
      const n = 1 + Math.ceil(Math.random() * 6)
      for (let j = 0; j < n; ) {
        const c = getCell()
        if (c[0] === 'wild' && (i === 0 || types.wild)) continue
        const m = 1 // c[0] === 'wild' ? 1 : (1 + Math.floor(Math.sqrt(Math.random() * (n-j) * (n-j))))
        // console.log(m)

        for (let k = 0; k < m && j < n; k++, j++) {
          col.push(c)
          types[c[0]] = (types[c[0]] || 0) + 1
        }
      }
      cols.push({ cells: col, types })
    }
    setColumns(cols)
  }

  const init = fillColumns

  return {
    init, fillColumns,
    columns, setColumns,
  }
}


const useBoard = () => {
  const [ squares, setSquares ] = useState([])

  const addHouse = (id, n=1) => {
    setSquares(s => {
      s[id].houses += n
      return [ ...s ]
    })
  }

  const clearHouse = (id) => {
    setSquares(s => {
      s[id].houses = 0
      return [ ...s ]
    })
  }

  const own = (id, v=true) => {
    setSquares(s => {
      s[id].owned = v
      return [ ...s ]
    })
  }
  
  const reset = () => setSquares([
    { type: 'go' },
    { type: 'property', color: 'brown', name: 'Brown 1', houses: 0 },
    { type: 'chest' },
    { type: 'property', color: 'brown', name: 'Brown 2', houses: 0 },
    { type: 'tax' },
    { type: 'rr', name: 'RR 1', owned: false },
    { type: 'property', color: 'cyan', name: 'Cyan 1', houses: 0 },
    { type: 'chance' },
    { type: 'property', color: 'cyan', name: 'Cyan 2', houses: 0 },
    { type: 'property', color: 'cyan', name: 'Cyan 3', houses: 0 },
    { type: 'jail' },
    { type: 'property', color: 'purple', name: 'Purple 1', houses: 0 },
    { type: 'utility', name: 'Electric Company', owned: false },
    { type: 'property', color: 'purple', name: 'Purple 2', houses: 0 },
    { type: 'property', color: 'purple', name: 'Purple 3', houses: 0 },
    { type: 'rr', name: 'RR 2', owned: false },
    { type: 'property', color: 'orange', name: 'Orange 1', houses: 0 },
    { type: 'chest' },
    { type: 'property', color: 'orange', name: 'Orange 2', houses: 0 },
    { type: 'property', color: 'orange', name: 'Orange 3', houses: 0 },
    { type: 'free' },
    { type: 'property', color: 'red', name: 'Red 1', houses: 0 },
    { type: 'chance' },
    { type: 'property', color: 'red', name: 'Red 2', houses: 0 },
    { type: 'property', color: 'red', name: 'Red 3', houses: 0 },
    { type: 'rr', name: 'RR 3', owned: false },
    { type: 'property', color: 'yellow', name: 'Yellow 1', houses: 0 },
    { type: 'property', color: 'yellow', name: 'Yellow 2', houses: 0 },
    { type: 'utility', name: 'Water Works', owned: false },
    { type: 'property', color: 'yellow', name: 'Yellow 3', houses: 0 },
    { type: 'gotojail' },
    { type: 'property', color: 'green', name: 'Green 1', houses: 0 },
    { type: 'property', color: 'green', name: 'Green 2', houses: 0 },
    { type: 'chest' },
    { type: 'property', color: 'green', name: 'Green 3', houses: 0 },
    { type: 'rr', name: 'RR 4', owned: false },
    { type: 'chance' },
    { type: 'property', color: 'blue', name: 'Blue 1', houses: 0 },
    { type: 'tax' },
    { type: 'property', color: 'blue', name: 'Blue 2', houses: 0 },
  ])

  return {
    squares, setSquares,
    addHouse, clearHouse,
    own,
    reset,
    init: reset,
  }
}

/*

credits

regular/bonus
  spins
    left
    played
  amount won
    this spin
    this move
    total

utilities owned
railroads owned

chain [0 0 1 2 3 4 5...]

slots [6]
  slot
    height (2-7)
    cells [2-7]

cells
  9 (0.1 0.2 0.3 0.4)
  T (0.1 0.2 0.3 0.4)
  J (0.15 0.25 0.4 0.5)
  Q (0.15 0.25 0.4 0.5)
  K (0.2 0.3 0.5 0.6)
  A (0.2 0.3 0.5 0.6)
  dog (0.25 0.4 0.6 0.9)
  car (0.25 0.5 0.8 1.5)
  boat (0.4 0.8 1 5)
  hat (2 5 10 20 50)

board
  square
    type
    owned?
    houses#

*/