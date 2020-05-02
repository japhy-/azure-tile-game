import React, { useState, useEffect, createRef } from 'react'
import { useStitchWatcher } from '../../utilities/Stitch'
import { useStorage } from '../../utilities/Storage'

const Lobby = ({game}) => {
  const storage = useStorage('session')

  const [ name, setName ] = useState('')
  const [ nplayers, setNplayers ] = useState(2)
  const [ code, setCode ] = useState('')
  const [ joinCode, setJoinCode ] = useState('')

  useEffect(() => {
    setCode(generateGameCode())
  }, [])

  const screenname = storage.get('screenname')

  if (screenname) {
    return (
      <div>
        <h1>Welcome back, {screenname}!</h1>
        <button onClick={() => storage.remove("screenname")}>Log Out</button>
      </div>
    )
  }
  else {
    const ref = createRef()
    return (
      <div>
        <h1>You need to log in!</h1>
        <input type="text" name="screenname" ref={ref}/>
        <button onClick={() => storage.set("screenname", ref.current.value)}>Log In</button>
      </div>
    )
  }

  return <div>???</div>


  return (
    <div style={{display: 'flex', flexGrow: 1, flexDirection: 'column', alignItems: 'center'}}>
      <h1>Identify Yourself!</h1>
      <div>
        <b>Screen name:</b>{" "}
        <input type="text" name="screenname" onChange={(ev) => setName(ev.target.value)}/>
      </div>
      <h2>Start a New Game</h2>
      <div>
        <b>Game Code:</b> {code}
      </div>
      <div>
        <b>How many players?</b>{" "}
          <label><input type="radio" name="nplayers" value={2} defaultChecked onClick={(ev) => setNplayers(ev.target.value)}/> 2</label>
          <label><input type="radio" name="nplayers" value={3} onClick={(ev) => setNplayers(ev.target.value)}/> 3</label>
          <label><input type="radio" name="nplayers" value={4} onClick={(ev) => setNplayers(ev.target.value)}/> 4</label>
      </div>
      <div>
        <button onClick={() => name !== '' && game({name, code, nplayers})}>New Game</button>
      </div>
      <h2>Join a Game</h2>
      <div>
        <b>Game Code:</b>{" "}
        <input type="text" name="code" maxLength={4} style={{width: '4em'}} onChange={(ev) => setJoinCode(ev.target.value)}/>
      </div>
      <div>
        <button onClick={() => name !== '' && game({name, code: joinCode})}>Join Game</button>
      </div>
      <hr/>

      <AllDocuments/>
    </div>
  )
}

const AllDocuments = () => {
  const [ events, setEvents ] = useState([])
  const addEvent = ev => setEvents(e => [...e, ev])

  const { ready } = useStitchWatcher({collection: 'azure', onNext: addEvent})

  return (
    <div>
      <h3>Watching All Documents</h3>
      {ready ? (
        <>
          <h4>Listening...</h4>
          {events.map(ev => <div>{JSON.stringify(ev)}</div>)}
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

