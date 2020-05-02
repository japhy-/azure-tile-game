import React, { useState, createContext, useEffect, useContext, useRef } from 'react'
import * as S from '../constants'

const { Stitch, RemoteMongoClient, AnonymousCredential } = require('mongodb-stitch-browser-sdk');

const StitchContext = createContext({})

const StitchWrapper = ({cluster=S.CLUSTER, database=S.DATABASE, collection=S.COLLECTION, accountsCollection=S.ACCOUNTS, children}) => {
  const [ stitch, setStitch ] = useState({connected: false})
  const [ loading, setLoading ] = useState(true)
  const [ error, setError ] = useState(null)

  useEffect(() => {
    const client = Stitch.initializeDefaultAppClient(cluster);
    const root = client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas');
    const db = root.db(database)
    const game = db.collection(collection)
    const accounts = db.collection(accountsCollection)

    client.auth.loginWithCredential(new AnonymousCredential()).then(user => {
      setStitch({ client, root, db, game, accounts, user, connected: true })
      setLoading(false)
    }).catch(err => {
      console.log('error', err)
      setError(error)
    })
  // eslint-disable-next-line
  }, [])

  if (error) return (
    <div>Error connecting to the database!</div>
  )

  if (loading) return (
    <div>Connecting to the database...</div>
  )
  
  return (
    <StitchContext.Provider value={stitch}>
      {children}
    </StitchContext.Provider>
  )
}

const StitchWatcherContext = createContext(null)

const StitchWatcher = ({children, ...props}) => {
  const watcher = useStitchWatcher(props)

  return (
    <StitchWatcherContext.Provider value={watcher}>
      {children}
    </StitchWatcherContext.Provider>
  )
}

const useStitchWatcher = ({database=null, collection, onNext=(ev) => console.log(ev), compact=false, filter=[]}) => {
  const stitch = useContext(StitchContext)
  const [ ready, setReady ] = useState(false)
  const watcherRef = useRef(null)

  useEffect(() => {
    // connect watcher
    (database === null ? stitch.db : stitch.root.db(database)).collection(collection)[compact ? 'watchCompact' : 'watch'](filter).then(w => {
      // console.log('opening watcher', w)
      w.onNext((ev) => onNext(ev, new Date ()))
      watcherRef.current = w
      setReady(true)
    })

    // disconnect watcher
    return () => {
      // console.log('closing watcher', watcherRef)
      watcherRef.current && watcherRef.current.close()
      setReady(false)
    }
  // eslint-disable-next-line
  }, [])

  return { ready, stream: watcherRef.current }
}

export default StitchWrapper
export { StitchContext, StitchWatcher, StitchWatcherContext, useStitchWatcher }