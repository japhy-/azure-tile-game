import React, { useContext, useState, useEffect, useRef } from 'react'
import { StitchProvider, StitchContext, useStitchCollectionWatcher, /*useStitchCollectionMonitor*/ } from './utilities/Stitch2'
import { UserPasswordCredential, BSON } from 'mongodb-stitch-browser-sdk'


const App2 = () => {
  const [ s, setS ] = useState(true)

  return (
    <div>
      <div>
        <button onClick={() => setS(s => !s)}>Toggle Stitch</button>
      </div>
      {s && (<StitchProvider cluster="share-the-sky-dpdbc">
        <App3/>
      </StitchProvider>)}
    </div>
  )
}

const App3 = () => {
  const stitch = useContext(StitchContext)

  return (
    <div>
      <div>[STITCH IS ENABLED]</div>
      {stitch.user && (<div>[{stitch.user.id} IS LOGGED IN]</div>)}
      <div>
        <button onClick={() => {
          stitch.isAuthed ? stitch.logout() : stitch.login(new UserPasswordCredential ('japhy.734@gmail.com', 'dnRkR55iv6*E$F'))
        }}>Log {stitch.isAuthed ? 'out' : 'in'}</button>
      </div>
      {stitch.user && <App4/>}
    </div>
  )
}

const App4 = () => {
  const stitch = useContext(StitchContext)
  const watch = useStitchCollectionWatcher(stitch)
  // const monitor = useStitchCollectionMonitor(stitch)

  const [ channelList, setChannelList ] = useState([])
  const [ joinedChannels, setJoinedChannels ] = useState(new Map ([ ]))

  const joinChannel = (name) => {
    stitch.service.db('games').collection('channels').updateOne({name}, {
      $setOnInsert: {
        name,
        tsCreated: new Date (),
        creator: stitch.user.id,
      }
    }, {upsert: true}).then(res => res.upsertedId || stitch.service.db('games').collection('channels').findOne({name}).then(({_id}) => _id)).then(channelId => {
      console.log(`joining channel ${name} (${channelId})`)
      setJoinedChannels(chans => new Map([ ...chans, [ name, <Monitor
        channelId={channelId} db="games" collection="messages" filter={{'fullDocument.channelId': channelId}}
        onNext={(ev) => {

        }}
      />]]))
    })
  }

  const partChannel = (name) => {
    const monitor = joinedChannels.get(name)
    if (monitor) {
      console.log(`parting channel ${name} (${monitor.props.channelId})`)
      setJoinedChannels(chans => new Map ([...chans].filter(([k,v]) => k !== name)))
    }
    else {
      console.log(`you're not in channel ${name}`)
    }
  }

  useEffect(() => {
    watch.watchCollection({ name: 'channels', db: 'games', collection: 'channels'})
  }, [])

  // create a random message every 10 seconds
  useEffect(() => {
    return

    const getRandomChannel = () => ['abc', 'def', 'ghi', 'jkl'][Math.floor(Math.random() * 4)]
    const getRandomUser = () => ['jeff', 'japhy', 'chad', 'chris', 'damian'][Math.floor(Math.random() * 5)]
    const getRandomMessage = () => `${(new BSON.ObjectID ()).toString()} and ${(new BSON.ObjectID ()).toString()}`

    const timer = setInterval(() => {
      const channel = getRandomChannel()
      const user = getRandomUser()
      const message = getRandomMessage()

      ;(async () => {
        const channelId = await stitch.service.db('games').collection('channels').updateOne({name: channel}, {
          $setOnInsert: {
            name: channel,
            tsCreated: new Date (),
            creator: stitch.user.id,
          }
        }, {upsert: true}).then(res => res.upsertedId || stitch.service.db('games').collection('channels').findOne({name: channel}).then(({_id}) => _id))
        
        console.log(`writing ${message} as ${user} to ${channel} (${channelId})`)
        stitch.service.db('games').collection('messages').insertOne({
          channelId,
          user,
          message,
          ts: new Date (),
        })
      })()
    }, 1000 * 10)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'stretch'}}>
      <div style={{border: '1px solid black', flex: 1}}>
        <h3>Channel List</h3>
        <div>
          for each channel, list name with join/part button
        </div>
      </div>
      <div style={{border: '1px solid blue', flex: 1}}>
        <h3>Monitors</h3>
        <div>
          {[...joinedChannels].map(([k, v]) => (
            <div key={k}>
              <b>Monitoring {k}</b>
              {v}
            </div>
          ))}
        </div>
      </div>
      {/* 
      <div style={{border: '1px solid red', flex: 1}}>
        <h1>Watchers</h1>
        {[...watch.collections].map(([k, v]) => (
          <div key={k}>
            <b>Watcher {k}</b>
            {v.db}.{v.collection}
          </div>
        ))}
      </div>
      */}
    </div>
  )
}


const Watcher = ({db='games', collection, filter={}, onNext}) => {
  const stitch = useContext(StitchContext)
  const stream = useRef(null)
  const [ ready, setReady ] = useState(false)
  const [ messages, setMessages ] = useState([])

  useEffect(() => {
    let mounted = true

    stitch.service.db(db).collection(collection).watch(filter).then(str => {
      if (! mounted) {
        console.log(`unmounted while connecting to ${db}.${collection}`, filter)
        str.close()
        return
      }
      str.onNext(ev => {
        setMessages(msgs => [ ...msgs, ev ])
        onNext && onNext(ev)
      })
      console.log(`successfully watching ${db}.${collection}`)
      stream.current = str
      setReady(true)
    })

    return () => {
      mounted = false
      setReady(false)
      stream.current && stream.current.close()
    }
  }, [])

  return (
    <div>
      (stream from {collection})
      <div>{ready ? 'ready' : 'not ready'}</div>
      <div>{messages.map((m, idx) => {
        return (<div key={idx}>
          <b>{m.operationType}</b>: {m.documentKey._id.toString()} = {JSON.stringify(m.fullDocument)}
        </div>)
      })}</div>
    </div>
  )
}


const Monitor = ({db='games', collection, find={}, filter={}, onNext}) => {
  const stitch = useContext(StitchContext)
  const [ ready, setReady ] = useState(false)
  const [ docs, setDocs ] = useState(new Map ([]))
  const [ watcher, setWatcher ] = useState(null)

  useEffect(() => {
    let mounted = true

    stitch.service.db(db).collection(collection).find(find).toArray().then(rows => {
      setDocs(new Map (rows.map(r => [ r._id.toString(), r ])))

      const oldOnNext = onNext
      onNext = ev => {
        const { operationType: type, documentKey: { _id } } = ev
        const doc = oldOnNext ? oldOnNext(ev) : ev.fullDocument
        
        setDocs(docs => {
          if (type === 'delete') docs.delete(_id.toString())
          else if (type === 'insert' || type === 'update' || type === 'replace') docs.set(_id.toString(), doc)
          return new Map (docs)
        }) 
      }

      setReady(true)
      console.log(`successfully monitoring ${db}.${collection}`)

      setWatcher(<Watcher {...{db, collection, filter, onNext}}/>)
    })

    return () => {
      mounted = false
      setReady(false)
    }
  }, [])

  return (
    <div>
      (monitoring {db}.{collection})
      <div>{ready ? 'ready' : 'not ready'}</div>
      {ready && (<>
        <div>{[...docs].map(([k, v]) => {
          return (<div key={k.toString()}>
            {JSON.stringify(v)}
          </div>)
        })}</div>
        {watcher}
      </>)}
    </div>
  )
}


const Monitor2 = ({db='games', collection, find={}, filter={}, onNext}) => {
  const stitch = useContext(StitchContext)
  const stream = useRef(null)
  const [ ready, setReady ] = useState(false)
  const [ docs, setDocs ] = useState(new Map ([]))

  useEffect(() => {
    let mounted = true

    stitch.service.db(db).collection(collection).find(find).toArray().then(rows => {
      setDocs(new Map (rows.map(r => [ r._id.toString(), r ])))

      stitch.service.db(db).collection(collection).watch(filter).then(str => {
        if (! mounted) {
          console.log(`unmounted while connecting to ${db}.${collection}`, filter)
          str.close()
          return
        }
        str.onNext(ev => {
          const { operationType: type, documentKey: { _id } } = ev
          const doc = onNext ? onNext(ev) : ev.fullDocument
          
          setDocs(docs => {
            if (type === 'delete') docs.delete(_id.toString())
            else if (type === 'insert' || type === 'update' || type === 'replace') docs.set(_id.toString(), doc)
            return new Map (docs)
          })
        })
        setReady(true)
        stream.current = str
        console.log(`successfully monitoring ${db}.${collection}`)
      })
    })

    return () => {
      mounted = false
      setReady(false)
      stream.current && stream.current.close()
    }
  }, [])

  return (
    <div>
      (monitoring {db}.{collection})
      <div>{ready ? 'ready' : 'not ready'}</div>
      {ready && (
        <div>{[...docs].map(([k, v]) => {
          return (<div key={k.toString()}>
            {JSON.stringify(v)}
          </div>)
        })}</div>
      )}
    </div>
  )
}





const App100 = () => {
  const stitch = useContext(StitchContext)

  const [ joining, setJoining ] = useState({})
  const addJoining = (_id) => {
    setJoining(j => ({ ...j, [_id]: true }))
  }
  const delJoining = (_id) => {
    setJoining(j => ({ ...j, [_id]: false }))
  }
  const joinChannel = ({_id}) => {
    addJoining(_id)
    console.log(`joining channel id ${_id}`)
    new Promise(
      // ok => ok(addMonitor(<StitchCollectionWatcher key={`messages-${_id}`} name={`messages-${_id}`} db="games" collection="messages" filter={{"fullDocument.channelId":_id}} onNext={ev => { console.log(ev); return ev.fullDocument; }} />))
    ).then(() => delJoining(_id))
  }
  const partChannel = ({_id}) => {
    removeMonitor(`messages-${_id}`)
  }

  const [ monitors, setMonitors ] = useState([])
  const addMonitor = m => setMonitors(monitors => [...monitors, m])
  const removeMonitor = name => setMonitors(monitors => [...monitors.filter(mon => mon.props.name !== name)])

  useEffect(() => {
    if (! stitch.isAuthed && monitors.length > 0) setMonitors([])
  }, [stitch.isAuthed, monitors])

  const [ channelName, setChannelName ] = useState('')
  const channelsColl = useRef()
  const setChannelsColl = v => channelsColl.current = v

  const addChannel = async () => {
    const name = channelName.replace(/^#/, '')
    setChannelName('')
    const id = await channelsColl.current.updateOne({name}, {
      $setOnInsert: {
        name,
        tsCreated: new Date (),
        creator: stitch.user.id,
      }
    }, {upsert: true}).then(res => res.upsertedId || channelsColl.current.findOne({name}).then(({_id}) => _id).catch(err => undefined)).catch(err => undefined)
    if (id !== null) {
      console.log(`joining #${name} (id=${id})`)
      joinChannel(id)
    }
  }

  useEffect(() => {
    if (stitch.isAuthed) {
      console.log(`watching games.channels`)
      setChannelsColl(stitch.service.db('games').collection('channels'))
      // addMonitor(<StitchCollectionWatcher key="channels" name="channels" db="games" collection="channels"/>)
    }
    // eslint-disable-next-line
  }, [stitch.isAuthed])

  useEffect(() => {
    return () => {
      setMonitors([])
    }
  }, [])

  const channels = stitch.collections.get('channels')

  return (
    <div>
      {monitors}
      <div><b>Authed:</b> {stitch.isAuthed ? 'y' : 'n'}</div>
      <div><b>User:</b> {stitch.user ? stitch.user.id : null}</div>
      <div>
        <button onClick={() => {
          stitch.service.db('games').collection('channels').deleteMany({})
        }}>Truncate games.channels</button>
      </div>
      <div>
        <button onClick={() => {
          stitch.service.db('games').collection('messages').deleteMany({})
        }}>Truncate games.messages</button>
      </div>
      <div>
        <button onClick={() => {
          stitch.isAuthed ? stitch.logout() : stitch.login(new UserPasswordCredential ('japhy.734@gmail.com', 'dnRkR55iv6*E$F'))
        }}>Log {stitch.isAuthed ? 'out' : 'in'}</button>
      </div>
      <hr/>
      <div>
        <h3>Channels</h3>
        <div>
          <input type="text" placeholder="channel name" value={channelName} onChange={ev => setChannelName(ev.target.value)}/>
          <button onClick={addChannel}>Add/Create Channel</button>
        </div>
        {channels && [...channels].map(([i, c]) => (
          <div key={i}>
            #{c.name} ({i})
            {joining[c._id.toString()] && (" Joining... ")}
            {stitch.collections.get(`messages-${i}`) ? (
              <button onClick={() => partChannel(c)}>Leave Channel</button>
            ) : (
              <button onClick={() => joinChannel(c)}>Join Channel</button>
            )}
            {/*
            {watchers[c.id.toString()] ? (<>
              <input type="text" value={channelMessages[c.id.toString()] || ''} onChange={ev => setChannelMessage(c, ev.target.value)}/>
              <button onClick={() => sendChannelMessage(c)}>Send</button>
              <button onClick={() => delWatcher(c.id.toString())}>Leave Channel</button>
            </>) : (<>
              {joining[c.id.toString()] ? (" Joining... ") : (<button onClick={() => joinChannel(c.id.toString())}>Join Channel</button>)}
            </>)}
            */}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App2

  /*
  const [ messages, setMessages ] = useState([])
  const addMessage = (msg) => setMessages(m => [ ...m, msg ])

  const [ watchers, setWatchers ] = useState({})
  const addWatcher = (id) => {
    stitch.subscribe('games', 'messages', {'fullDocument.channelId': id}, ev => addMessage(ev.fullDocument)).then((stream) => {
      setWatchers(streams => ({ ...streams, [id.toString()]: stream }))
      delJoining(id.toString())
    })
  }
  const delWatcher = (id) => {
    stitch.unsubscribe(watchers[id.toString()]).then(() => {
      setWatchers(streams => { delete streams[id.toString()]; return {...streams}; })
    })
  }

  const [ channelMessages, setChannelMessages ] = useState({})
  const setChannelMessage = (c, msg) => {
    setChannelMessages(cm => ({ ...cm, [c.id.toString()]: msg }))
  }
  const sendChannelMessage = (c) => {
    stitch.service.db('games').collection('messages').insertOne({
      channelId: c.id,
      channelName: c.name,
      ts: new Date (),
      msg: channelMessages[c.id.toString()],
    })
    setChannelMessage(c, '')
  }
  */

