import React, { useState, createContext, useEffect, useRef, useCallback, useContext } from 'react'
import { Stitch, RemoteMongoClient } from 'mongodb-stitch-browser-sdk'
import { useInterceptState } from './CustomHooks'


export const StitchContext = createContext({})

export const StitchProvider = ({cluster, children}) => {
  return <StitchContext.Provider value={useStitch(cluster)}>{children}</StitchContext.Provider>
}

export const useStitch = (cluster) => {
  const [ client, setClient ] = useState(null)
  const [ service, setService ] = useState(null)
  const [ user, updateUser ] = useInterceptState(() => (client && client.auth.user) || null)
  const [ isAuthed, updateIsAuthed ] = useInterceptState(() => (client && client.auth.isLoggedIn) || false)
  const isMounted = useRef(false)

  useEffect(() => {
    console.log('> stitch mounted')
    isMounted.current = true
    setClient( Stitch.hasAppClient(cluster) ? Stitch.getAppClient(cluster) : Stitch.initializeAppClient(cluster) )

    return () => {
      console.log('< stitch unmounted')
      isMounted.current = false
      setClient()
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    updateIsAuthed()
    // eslint-disable-next-line
  }, [service])

  useEffect(() => {
    setService(client && client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas'))
    // eslint-disable-next-line
  }, [client])

  useEffect(() => {
    updateUser()
    // eslint-disable-next-line
  }, [isAuthed])

  const login = async (cred) => {
    await client.auth.loginWithCredential(cred)
    updateIsAuthed()
  }

  const logout = async () => {
    await client.auth.logout()
    updateIsAuthed()
  }

  return {
    login,
    logout,
    service,
    isAuthed,
    user,
  }
}


export const StitchCollectionWatcherContext = createContext({})

export const StitchCollectionWatcherProvider = ({stitch, children}) => {
  return <StitchCollectionWatcherContext.Provider value={useStitchCollectionWatcher(stitch)}>{children}</StitchCollectionWatcherContext.Provider>
}

export const useStitchCollectionWatcher = (stitch) => {
  const _stitch = useContext(StitchContext)
  if (! stitch) stitch = _stitch
  const isMounted = useRef(false)

  const [ watchedCollections, setWatchedCollections ] = useState(new Map ([]))

  const watchCollection = async ({name, db, collection, filter={}, onNext=null}) => {
    console.log(`trying to watch '${name}': ${db}.${collection} -- ${stitch.isAuthed ? 'ok' : 'not ok'}`)
    if (! stitch.isAuthed) return

    return await stitch.service.db(db).collection(collection).watch(filter).then(stream => {
      if (! isMounted.current) {
        console.log(`unmounted while connecting to '${name}': ${db}.${collection} ${JSON.stringify(filter)}`)
        stream.close()
        return
      }
      console.log(`successfully watching '${name}': ${db}.${collection}`)
      stream.onNext(ev => console.log(ev))
      setWatchedCollections(watched => new Map ([...watched, [ name, { stream, db, collection, filter, onNext } ]]))
      return stream
    })
  }

  const unwatchCollection = (name) => {
    console.log(`unwatching collection`, name)
    const w = watchedCollections.get(name)
    w && w.stream && w.stream.close()
    setWatchedCollections(watched => new Map ([...watched].filter(([n]) => n !== name)))
  }

  const unwatchAllCollections = useCallback(() => {
    if (! watchedCollections.size) return

    console.log(`unwatching ${watchedCollections.size} collections`)
    watchedCollections.forEach((val, key) => unwatchCollection(key))
    setWatchedCollections(new Map ([]))
  }, [watchedCollections])

  useEffect(() => {
    console.log('watcher mounted!')
    isMounted.current = true

    return () => {
      console.log('watching unmounting...')
      isMounted.current = false
      unwatchAllCollections()
      console.log('watcher unmounted!')
    }

    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (! stitch.isAuthed) unwatchAllCollections()
  }, [stitch.isAuthed])

  return {
    collections: watchedCollections,
    watchCollection,
    unwatchCollection,
    unwatchAllCollections,
  }
}

/*
export const StitchCollectionMonitorContext = createContext({})

export const StitchCollectionMonitorProvider = ({stitch, children}) => {
  return <StitchCollectionMonitorContext.Provider value={useStitchCollectionMonitorContext(stitch)}>{children}</StitchCollectionMonitorContext.Provider>
}

export const useStitchCollectionMonitor = (stitch) => {
  const _stitch = useContext(StitchContext)
  if (! stitch) stitch = _stitch
  const isMounted = useRef(false)

  const [ monitoredCollections, setMonitoredCollections ] = useState(new Map ([]))
  const [ docs, setDocs ] = useState(new Map ())

  const monitorCollection = async ({name, db, collection, filter={}, onNext=null}) => {
    console.log(`trying to watch '${name}': ${db}.${collection} -- ${stitch.isAuthed ? 'ok' : 'not ok'}`)
    if (! stitch.isAuthed) return

    return await stitch.service.db(db).collection(collection).watch(filter).then(stream => {
      if (! isMounted.current) {
        console.log(`unmounted while connecting to '${name}': ${db}.${collection} ${JSON.stringify(filter)}`)
        stream.close()
        return
      }
      console.log(`successfully watching '${name}': ${db}.${collection}`)
      stream.onNext(ev => {
        const { operationType: type, documentKey: { _id } } = ev
        const doc = onNext ? onNext(ev) : ev.fullDocument
  
        setDocs(docs => {
          if (type === 'delete') docs.delete(_id.toString())
          else if (type === 'insert' || type === 'update' || type === 'replace') docs.set(_id.toString(), doc)
          return new Map (docs)
        })  
      })
      setMonitoredCollections(watched => new Map ([...watched, [ name, { stream, db, collection, filter, onNext } ]]))
      return stream
    })
  }

  const unmonitorCollection = (name) => {
    console.log(`unwatching collection`, name)
    const w = monitoredCollections.get(name)
    w && w.stream && w.stream.close()
    setMonitoredCollections(watched => new Map ([...watched].filter(([n]) => n !== name)))
  }

  const unmonitorAllCollections = useCallback(() => {
    if (! monitoredCollections.size) return

    console.log(`unwatching ${monitoredCollections.size} collections`)
    monitoredCollections.forEach((val, key) => unmonitorCollection(key))
    setMonitoredCollections(new Map ([]))
  }, [monitoredCollections])

  useEffect(() => {
    console.log('watcher mounted!')
    isMounted.current = true

    return () => {
      console.log('watching unmounting...')
      isMounted.current = false
      unmonitorAllCollections()
      console.log('watcher unmounted!')
    }

    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (! stitch.isAuthed) unmonitorAllCollections()
  }, [stitch.isAuthed])

  return {
    collections: monitoredCollections,
    monitorCollection,
    unmonitorCollection,
    unmonitorAllCollections,
  }


  const [ subscriptions, setSubscriptions ] = useState(new Map ([]))
  const subscribe = async ({db=null, collection, filter={}, onNext=null}) => {
    const coll = db === null ? collection : mongo.db(db).collection(collection)
    if (db === null) [ db, collection ] = coll.namespace.split('.')
    return await coll.watch(filter).then(stream => {
      if (! isMounted.current) {
        console.log(`ending subscription early`)
        stream.close()
        return null
      }
      stream.onNext(onNext)
      setSubscriptions(subs => new Map ([...subs, [stream, {db, collection, filter, onNext}]]))
      return stream
    })
  }
  const unsubscribe = async (stream) => {
    subscriptions[stream] && setSubscriptions(subs => {
      return new Map (subs.entries().filter(([s]) => s !== stream));
    })
    stream && stream.close()
  }

  const unsubscribeAll = () => {
    subscriptions.forEach((val, key) => unsubscribe(key))
  }

  const monitorRef = useRef({
    stream: null,
    onNext: ev => {
      // const { ..., updateDescription: changes, namespace: { database: db, collection: coll } } = ev
      const { operationType: type, documentKey: { _id } } = ev
      const doc = onNext ? onNext(ev) : ev.fullDocument

      setDocs(docs => {
        if (type === 'delete') docs.delete(_id.toString())
        else if (type === 'insert' || type === 'update' || type === 'replace') docs.set(_id.toString(), doc)
        return new Map (docs)
      })
    }
  })

  useEffect(() => {
    if (stitch.isAuthed) {
      collectionRef.current = stitch.service.db(db).collection(collection)
      collectionRef.current.find(find).toArray().then(async rows => {
        setDocs(new Map (rows.map(r => [r._id.toString(), r])))
        monitorRef.current.stream = await stitch.subscribe({collection: collectionRef.current, filter, onNext: monitorRef.current.onNext})
        if (! isMounted.current) {
          console.log(`ending watch on ${name} early`)
          monitorRef.current.stream.close()
        }
      })
    }
    else {
      stitch.unsubscribe(monitorRef.current.stream)
      stitch.unwatchCollection(name)      
    }
    // eslint-disable-next-line
  }, [stitch.isAuthed])

  useEffect(() => {
    stitch.watchCollection(name, docs)
  }, [name, docs])

  useEffect(() => {
    isMounted.current = true
    return () => {
      console.log(`unmounting ${name}`)
      isMounted.current = false
      stitch.unsubscribe(monitorRef.current.stream)
      stitch.unwatchCollection(name)
    }
  }, [])

  return (
    <div>
      ['{name}' is watching {db}.{collection}]
    </div>
  )
}
*/