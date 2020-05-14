import React, { useContext, useState } from 'react'
import StitchProvider, { StitchContext } from './utilities/Stitch2'
import { UserPasswordCredential, BSON } from 'mongodb-stitch-browser-sdk'

const App2 = () => {
  return (
    <StitchProvider cluster="share-the-sky-dpdbc">
      <App3/>
    </StitchProvider>
  )
}

const App3 = () => {
  const stitch = useContext(StitchContext)

  const [ messages, setMessages ] = useState([])
  const addMessage = (msg) => setMessages(m => [ ...m, msg ])

  const [ channels, setChannels ] = useState([])
  const addChannel = (ch) => {
    setChannels(c => [ ...c, ch ])
    stitch.mongo.db('games').collection('messages').watch({'fullDocument.channelId': ch}).then(w => {
      w.onNext(ev => addMessage(ev.fullDocument))
    })
  }

  const [ channelMessages, setChannelMessages ] = useState({})
  const setChannelMessage = (c, msg) => {
    setChannelMessages(cm => ({ ...cm, [c.toString()]: msg }))
  }
  const sendChannelMessage = (c) => {
    stitch.mongo.db('games').collection('messages').insertOne({
      channelId: c,
      ts: new Date (),
      msg: channelMessages[c.toString()],
    })
    setChannelMessage(c, null)
  }

  return (
    <div>
      <div><b>Authed:</b> {stitch.isAuthed ? 'y' : 'n'}</div>
      <div><b>User:</b> {stitch.user ? stitch.user.id : null}</div>
      <hr/>
      <div>
        <button onClick={() => {
          stitch.isAuthed ? stitch.logout() : stitch.login(new UserPasswordCredential ('japhy.734@gmail.com', 'dnRkR55iv6*E$F'))
        }}>Log {stitch.isAuthed ? 'out' : 'in'}</button>
      </div>
      <div>
        <h3>Channels</h3>
        <div>
          <button onClick={() => {
            addChannel(new BSON.ObjectID ())
          }}>Add Channel</button>
        </div>
        {channels.map(c => (
          <div key={c.toString()}>
            {c.toString()}
            <input type="text" value={channelMessages[c.toString()]} onChange={ev => setChannelMessage(c, ev.target.value)}/>
            <button onClick={() => sendChannelMessage(c)}>Send</button>
          </div>
        ))}
      </div>
      <div>
        <h3>Messages</h3>
        {messages.map(m => (
          <div key={m._id.toString()}>Message {m._id.toString()}, Channel {m.channelId.toString()}: [{m.ts.toString()}] {m.msg}</div>
        ))}
      </div>
    </div>
  )
}

/*
const App4 = () => {
  const [ channel, setChannel ] = useState(null)
  const [ messages, setMessages ] = useState([])
  const [ authed, setAuthed ] = useState(stitchApp.auth.isLoggedIn)

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
*/

export default App2