import React, { useState } from 'react'
import StitchWrapper from './utilities/Stitch'
import Game from './Components/Game/'
import Lobby from './Components/Lobby/'
import './App.css'
import ActionWrapper from './utilities/ActionQueue'

const App = () => {
  const [ playing, setPlaying ] = useState({} || {code: 'abc', nplayers: 2})

  return (
    <StitchWrapper>
      <ActionWrapper>
        <div className="App">
          {playing.code ? (
            <Game {...playing}/>
          ) : (
            <Lobby game={setPlaying}/>
          )}
        </div>
      </ActionWrapper>
    </StitchWrapper>
  )
}

export default App