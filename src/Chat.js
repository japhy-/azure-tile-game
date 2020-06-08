import React, { useContext, useState, useEffect, useRef, useCallback } from 'react'
import { StitchProvider, StitchContext, useStitchCollectionWatcher, /*useStitchCollectionMonitor*/ } from './utilities/Stitch2'
import { UserPasswordCredential, BSON } from 'mongodb-stitch-browser-sdk'

const App = () => {
  const [ loggedIn, setLoggedIn ] = useState(true)
  const toggleLogin = () => setLoggedIn(s => !s)

  return (
    <div>
      {loggedIn ? <StitchProvider cluster="share-the-sky-dpdbc"><Lobby logout={toggleLogin}/></StitchProvider> : <Login login={toggleLogin}/>}
    </div>
  )
}

const Lobby = ({logout}) => {
  const stitch = useContext(StitchContext)
  const allChannels = useCollectionMonitor({db: 'games', collection: 'channels'})

  const [ joinedChannels, setJoinedChannels ] = useState([])
  const [ activeChannel, setActiveChannel ] = useState(null)

  const truncateMessages = () => stitch.service.db('games').collection('messages').deleteMany({})

  const joinChannel = (id) => {
    setJoinedChannels(chans => [...chans, id])
    setActiveChannel(id)
  }

  const partChannel = (id) => {
    setJoinedChannels(chans => {
      const pos = chans.indexOf(id)
      const newChans = chans.filter(c => c !== id)
      if (activeChannel === id) setActiveChannel(newChans[pos === 0 ? 0 : pos-1])
      return newChans
    })
  }

  useEffect(() => {
    if (stitch.service && !stitch.isAuthed) {
      console.log(`connecting to stitch`)
      stitch.login(new UserPasswordCredential ('japhy.734@gmail.com', 'dnRkR55iv6*E$F'))
    }
  }, [stitch.service, stitch.isAuthed])

  useEffect(() => {
    if (stitch.user) {
      allChannels.initialize()
    }
  }, [stitch.user])

  // create a random message every 10 seconds
  const postRandomMessage = useCallback(() => {
    if (! stitch.user) return
    if (! allChannels.docs.size) return

    const users = ['jeff', 'japhy', 'chad', 'chris', 'damian']

    const getRandomChannel = () => [...allChannels.docs][Math.floor(Math.random() * 0 * allChannels.docs.size)][1].name
    const getRandomUser = () => users[Math.floor(Math.random() * 5)]
    const getRandomMessage = () => `${(new BSON.ObjectID ()).toString()}`

    const postMessage = () => {
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
    }

    return postMessage()

    const timer = setInterval(postRandomMessage, 1000 * 20)

    return () => {
      clearInterval(timer)
    }
  }, [stitch.user, allChannels.docs])

  return (
    <div>
      <div>
        <button onClick={logout}>Log Out</button>
      </div>
      <div>
        <button onClick={truncateMessages}>Truncate Messages</button>
      </div>
      <div>
        <button onClick={postRandomMessage}>Post Random Message</button>
      </div>
      {allChannels.ready && (<div>
        <h1>Channel List</h1>
        <div>
          {[...allChannels.docs].filter(([id, channel]) => !channel.deleted).map(([id, channel]) => (
            <div key={id}>
              {joinedChannels.includes(id) ?
                <button onClick={() => partChannel(id)}>Part</button> :
                <button onClick={() => joinChannel(id)}>Join</button>
              }{" "}
              {activeChannel === id ? (
                <b>#{channel.name}</b>
              ) : (joinedChannels.includes(id) ? (
                <u><a onClick={() => setActiveChannel(id)}>#{channel.name}</a></u>
              ) : <>#{channel.name}</>
              )}
            </div>
          ))}
        </div>
      </div>)}
      {joinedChannels.map(id => <Channel key={id} setActiveChannel={setActiveChannel} active={activeChannel === id} channel={allChannels.docs.get(id)}/>)}
    </div>
  )
}

const Channel = ({active, channel, setActiveChannel}) => {
  const newMsgCount = useRef(0)
  const isActive = useRef(active)

  useEffect(() => {
    isActive.current = active
    if (active) newMsgCount.current = 0
  }, [active])

  const messages = useCollectionMonitor({
    db: 'games',
    collection: 'messages',
    find: { channelId: channel._id },
    options: { limit: 30, sort: { ts: -1 } },
    filter: { 'fullDocument.channelId': channel._id },
    onNext: ev => {
      if (ev.operationType === 'insert') {
        if (! isActive.current) newMsgCount.current++
      }
      return ev.fullDocument
    }
  })

  useEffect(() => {
    messages.initialize()
  }, [])

  return (
    <div>
      <div>
        {active ? (
          <b>Channel #{channel.name}</b>
        ) : (
          <><a onClick={() => setActiveChannel(channel._id.toString())}>#{channel.name}</a> [{newMsgCount.current} new]</>
        )}
      </div>
      {active && (<div>
        {[...messages.docs].map(([id, msg]) => <Message key={id} message={msg} />)}
      </div>)}
      <hr/>
    </div>
  )
}

const Message = ({message, highlight}) => {
  if (message.__stitch_deleted) return null

  return (
    <div>
      {message.__stitch_deleted ? 'X' : ''}[{message.ts.toString()}] &lt;{message.user}&gt; {message.message}
    </div>
  )
}


const useCollectionMonitor = ({db, collection, find={}, options={}, filter={}, onNext}) => {
  const stitch = useContext(StitchContext)
  const [ docs, setDocs ] = useState(new Map ([]))
  const [ ready, setReady ] = useState(false)
  const stream = useRef(null)
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true

    return () => {
      console.log(`killing stream for ${db}.${collection}`)
      stream.current && stream.current.close()
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    console.log(`ready? ${ready ? 'yes' : 'no'}`)
  }, [ready])

  return {
    ready,
    docs,

    initialize: () => {
      const coll = stitch.service.db(db).collection(collection)

      coll.watch({$or: [filter, {operationType: 'delete'}]}).then(str => {
        if (! isMounted.current) {
          console.log(`unmounted while initializing watcher`)
          str.close()
          return
        }
        stream.current = str
        str.onNext(ev => {
          const { operationType: type, documentKey: { _id } } = ev
          const doc = onNext ? onNext(ev) : ev.fullDocument
          
          setDocs(docs => {
            // if (type === 'delete') docs.has(_id.toString()) && docs.delete(_id.toString())
            if (type === 'delete') docs.has(_id.toString()) && docs.set(_id.toString(), { ...docs.get(_id.toString()), __stitch_deleted: true })
            else if (type === 'insert' || type === 'update' || type === 'replace') docs.set(_id.toString(), { ...doc, __stitch_deleted: false })
            return new Map (docs)
          })
        })

        coll.find(find, options).toArray().then(rows => {
          setDocs(new Map (rows.map(r => [ r._id.toString(), { ...r, __stitch_deleted: false } ]).sort(([a], [b]) => a.localeCompare(b))))
          setReady(true)
        })
      })
    }
  }
}

const Login = ({login}) => {
  return (
    <div>
      <button onClick={login}>Log In</button>
    </div>
  )
}

export default App