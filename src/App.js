import React, { useState, useEffect } from 'react'
import StitchWrapper from './utilities/Stitch'
import { Storage as StorageWrapper } from './utilities/Storage'
import Game from './components/Game/'
import Lobby from './components/Lobby/'
import './App.css'
import ActionWrapper from './utilities/ActionQueue'

import { Stitch, RemoteMongoClient, UserPasswordCredential } from 'mongodb-stitch-browser-sdk'
import pubsub from './utilities/StitchWatcher'

const stitchApp = Stitch.initializeDefaultAppClient('share-the-sky-dpdbc')
const stitchClient = stitchApp.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas')

const App = () => {
  const [ channel, setChannel ] = useState(null)
  const [ messages, setMessages ] = useState([])
  const [ authed, setAuthed] = useState(stitchApp.auth.isLoggedIn)

  const stitchLogIn = async () => {
    await stitchApp.auth.loginWithCredential(new UserPasswordCredential ('japhy.734@gmail.com', 'dnRkR55iv6*E$F'))
    setAuthed(stitchApp.auth.isLoggedIn)
    return
  }
  
  const stitchLogOut = async () => {
    await stitchApp.auth.logout()
    setAuthed(stitchApp.auth.isLoggedIn)
    return
  }

  useEffect(() => {
    authed && (async () =>
      setChannel( (await pubsub.subscribe({channel, eventHandler: ev => console.log(ev), collection: stitchClient.db('games').collection('channels')})).channel )
    )()
  }, [authed])
    
  useEffect(() => {
    (async () => !authed && await stitchLogIn())()

    return () => {
      channel !== null && pubsub.unsubscribe({channel})
    }
  }, [])

  return (
    <div>
      <div>
        <b>Stitch Status:</b> {authed ? "logged in" : "logged out"}
      </div>
      <div>
        <b>Channel ID:</b> {channel ? channel.toString() : "n/a"} ({listening ? 'subscribed' : 'unsubscribed'})
      </div>
      <div>
        <button onClick={authed ? stitchLogOut : stitchLogIn}>Log {authed ? "Out of" : "Into"} Stitch</button>
      </div>
      <div>
        <button onClick={() => { channel !== null && pubsub.unsubscribe({channel}) }}>Unsubscribe from channel</button>
      </div>
      <div>
        <b>Subscriptions:</b>
        <ul>
        </ul>
      </div>
    </div>
  )
}

const App2 = () => {
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