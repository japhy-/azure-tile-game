import React, { useState, useEffect } from 'react'
import StitchWrapper from './utilities/Stitch'
import { Storage as StorageWrapper } from './utilities/Storage'
import Game from './components/Game/'
import Lobby from './components/Lobby/'
import './App.css'
import ActionWrapper from './utilities/ActionQueue'

const App = () => {
  const [ playing, setPlaying ] = useState({host: true, code: 'abcd', nplayers: 2})

  return (
    <StitchWrapper>
      <ActionWrapper>
        <StorageWrapper method="local">
          <div className="App flex">
            {playing.code ? (
              <Game {...playing}/>
            ) : (
              <Lobby game={setPlaying}/>
            )}
          </div>
        </StorageWrapper>
      </ActionWrapper>
    </StitchWrapper>
  )
}

export default App