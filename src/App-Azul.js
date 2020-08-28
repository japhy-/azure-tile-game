import React, { useState } from 'react'
import ActionWrapper from './utilities/ActionQueue'
import { Storage as StorageWrapper } from './utilities/Storage'
import './App.css'
import { Azul } from './components/Azul'

const App = () => {
  const [ config, setConfig ] = useState({host: true, code: 'abcd', nplayers: 2})

  return (
    <ActionWrapper>
      <StorageWrapper method="local">
        <div className="App flex">
          <Azul {...config}/>
        </div>
      </StorageWrapper>
    </ActionWrapper>
  )
}

export default App