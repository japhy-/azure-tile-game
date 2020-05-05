import React, { useState, useEffect, useContext, useRef } from 'react'
import { useStitchWatcher, StitchContext } from '../../utilities/Stitch'
import { StorageContext } from '../../utilities/Storage'
import { useInputState } from '../../utilities/CustomHooks'

const Lobby = ({game}) => {
  const storage = useContext(StorageContext)
  const stitch = useContext(StitchContext)

  const screenname = storage.get('screenname')
  const _id = storage.get('_id')
  const autologin = storage.get('autologin')

  useEffect(() => {
    if (autologin && screenname && _id && stitch.client && !stitch.connecting && !stitch.user) {
      stitch.setCredentials({type: 'function', payload: { screenname, _id }})
    }
  }, [autologin, screenname, _id, stitch])

  useEffect(() => {
    if (stitch.user && stitch.user.isLoggedIn) {
      stitch.accounts.findOne({screenname}).then(res => storage.set('_id', res._id.toString()))
      stitch.game.insertOne({_uid: stitch.user.id, _uids: ['all'], type: 'login', ts: new Date (), details: `${screenname} logged in`})
    }
    // eslint-disable-next-line
  }, [stitch.user && stitch.user.isLoggedIn])

  return (
    <>
      <style type="text/css">{`
        x*x { border: 1px solid black; padding: 1px; margin: 1px; }
      `}</style>
      {/*<div><button onClick={storage.clear}>Clear Storage</button></div>*/}
      {(stitch.user && stitch.user.isLoggedIn) ? <LobbyProper game={game}/> : <Login/>}
    </>
  )
}

const Login = () => {
  const storage = useContext(StorageContext)
  const stitch = useContext(StitchContext)

  const [ screenname, setScreenname ] = useInputState(storage.get('screenname') || '')
  const [ password, setPassword ] = useInputState('')
  const [ autologin, setAutologin ] = useState(false)

  const login = () => {
    storage.set('screenname', screenname)
    storage.set('autologin', autologin)
    stitch.setCredentials({type: 'function', payload: { screenname, password }})
  }

  return (
    <div style={{display: 'flex', flexGrow: 1, flexDirection: 'column', alignItems: 'center'}}>
      {!stitch.connecting && (<>
        <h1>Log In</h1>
        <form onSubmit={(ev) => { ev.preventDefault(); login(); }}>
        <div>
          <b>Screen Name:</b> <input type="text" name="screenname" value={screenname} onChange={setScreenname}/>
        </div>
        <div>
          <b>Password:</b> <input type="password" name="password" value={password} onChange={setPassword}/>
        </div>
        <div>
          <label><input type="CHECKBOX" name="autologin" defaultChecked={autologin} onClick={(ev) => setAutologin(a => !a)}/> Remember me until I log out</label>
        </div>
        <div>
          <button type="submit">Enter</button>
        </div>
        </form>
      </>)}
      {stitch.connecting && (
        <div>
          Logging in...
        </div>
      )}
      {stitch.error && (
        <div>
          Database error {stitch.error.name}: {stitch.error.message}
        </div>
      )}
    </div>
  )
}

const LobbyProper = ({game}) => {
  const storage = useContext(StorageContext)
  const stitch = useContext(StitchContext)

  const screenname = storage.get('screenname')

  const [ nplayers, setNplayers ] = useState(2)
  const [ thiscomp, setThiscomp ] = useState(2)
  const [ code, setCode ] = useState('')
  const [ joinCode, setJoinCode ] = useState('')

  const logout = () => {
    stitch.game.insertOne({_uid: stitch.user.id, _uids: ['all'], type: 'logout', ts: new Date (), details: `${screenname} logged out`})
    storage.set('autologin', false)
    stitch.logout()
  }

  useEffect(() => {
    setCode(generateGameCode())
  }, [])

  return (
    <div style={{display: 'flex', flexGrow: 1, flexDirection: 'column', alignItems: 'center'}}>
      <h1>Welcome back, {screenname}!</h1>
      <h2>Start a New Game</h2>
      <div>
        <b>Game Code:</b> {code}
      </div>
      <div style={{display: 'flex', flexGrow: 1, flexDirection: 'column', alignItems: 'center'}}>
        <b>How many players?</b>
        <div>{[...Array(3).keys()].map(i => (
          <label key={`nplayers-${i}`}><input type="radio" name="nplayers" value={i+2} defaultChecked={i===0} onClick={(ev) => setNplayers(parseInt(ev.target.value))}/> {i+2}</label>
        ))}</div>
      </div>
      <div style={{display: 'flex', flexGrow: 1, flexDirection: 'column', alignItems: 'center'}}>
        <b>How many are playing from this computer?</b>
        <div>{[...Array(nplayers).keys()].map(i => (
          <label key={`thiscomp-${nplayers}-${i}`}><input type="radio" name="thiscomp" value={i+1} defaultChecked={i+1 === (thiscomp <= nplayers ? thiscomp : nplayers)} onClick={(ev) => setThiscomp(parseInt(ev.target.value))}/> {i+1}</label>
        ))}</div>
      </div>
      <div>
        <button onClick={() => game({screenname, code, nplayers})}>New Game</button>
      </div>
      <h2>Join a Game</h2>
      <div>
        <b>Game Code:</b>{" "}
        <input type="text" name="code" maxLength={4} style={{width: '4em'}} onChange={(ev) => setJoinCode(ev.target.value)}/>
      </div>
      <div>
        <button onClick={() => game({screenname, code: joinCode})}>Join Game</button>
      </div>
      <hr/>
      <div>
        <button onClick={logout}>Log Out</button>
      </div>
      <hr/>

      <Chat channel="global"/>
      <GameList game="azure"/>
    </div>
  )
}

const Chat = ({channel}) => {
  const stitch = useContext(StitchContext)
  const storage = useContext(StorageContext)

  const [ events, setEvents ] = useState([])
  const [ message, setMessage ] = useInputState('')
  const pending = useRef(null)

  const addEvent = (event, ts) => setEvents(e => {
    const { from, message } = event.fullDocument
    if (pending.current && from === pending.current.from && message === pending.current.message) pending.current = null
    return [...e, { event, ts }]
  })

  // initial population of chat messages
  useEffect(() => {
    stitch.db.collection('messages').find({channel}, {sort: {ts:-1}, limit: 10}).toArray().then(r => r.reverse().forEach(msg => addEvent({fullDocument: msg}, msg.ts)))
  }, [])
  
  const { ready } = useStitchWatcher({collection: 'messages', onNext: addEvent})
  
  const sendMessage = () => {
    pending.current = { ts: new Date (), from: storage.get('screenname'), message }
    setMessage('')

    if (pending.current) stitch.db.collection('messages').insertOne({
      _uid: stitch.user.id,
      _uids: ['all'],
      channel,
      ...pending.current,
    }).then(res => {
      console.log("message sent successfully")
    }).catch(err => {
      console.log("could not send message")
      setMessage(pending.current.message)
      pending.current = null
    })
  }

  return (
    <div>
      <h3>Global Chat</h3>
      <div className="messages">
        {ready ? (<>
          {events
          .map(({event}) => [event.fullDocument._id.toString(), event.fullDocument.ts.toLocaleString(), event.fullDocument.from, event.fullDocument.message])
          .map(([id, ts, from, message]) => (
            <div key={`message-${id}`}>
              [{ts}] <b>{from}</b>: {message}
            </div>
          ))}
          {pending.current && (<div key={`message-pending`}>
            ![{pending.current.ts.toLocaleString()}] <b>{pending.current.from}</b>: {pending.current.message}
          </div>)}
          </>
        ) : (
          <b>Connecting...</b>
        )}
      </div>
      {ready && (<div>
        <form onSubmit={(ev) => { ev.preventDefault(); sendMessage() }}>
          <div>
            Write a message:
            <input type="text" name="message" value={message} onChange={setMessage}/>
            <button type="submit" disabled={pending.current}>Send</button>
          </div>
        </form>
      </div>)}
    </div>
  )
}

const GameList = ({game}) => {
  const stitch = useContext(StitchContext)
  const storage = useContext(StorageContext)

  const [ list, setList ] = useState([])
  const gameEvent = (event) => {
    // console.log(event)
  }

  // populate game list
  useEffect(() => {
    stitch.db.collection(game).find({}, {sort: {'state.id':1}}).toArray().then(r => r.forEach(event =>
      gameEvent(event)
    ))
  }, [])

  // listen for updates to games
  const { ready } = useStitchWatcher({collection: 'messages', onNext: gameEvent})

  return (
    <div className="GameList">

    </div>
  )
}

const AllDocuments = () => {
  const [ events, setEvents ] = useState([])
  const addEvent = (event, ts) => setEvents(e => [...e, { event, ts }])

  const { ready } = useStitchWatcher({collection: 'azure', onNext: addEvent})

  return (
    <div>
      <h3>Watching All Documents</h3>
      {ready ? (
        <>
          <h4>Listening...</h4>
          <div>
            {events.map(({event, ts}, idx) => (
              <div key={`event-${idx}`}>
                [{ts.toLocaleString()}] <b>{event.operationType}</b> {event.namespace.collection}.{event.namespace.database}: {event.fullDocument.type} - {event.fullDocument.details}
              </div>
            ))}
          </div>
        </>
      ) : (
        <h4>Connecting...</h4>
      )}
    </div>
  )
}

const generateGameCode = () => {
  const now = new Date ()
  return [now.getSeconds(), (now.getHours()+1)*(now.getMinutes()+1), now.getMilliseconds(), now.getSeconds()+now.getMinutes()]
    .map(i => String.fromCharCode(65 + i%26)).join("")
}

export default Lobby