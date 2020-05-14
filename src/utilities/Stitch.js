import React, { useState, createContext, useEffect, useContext, useRef } from 'react'
import * as S from '../constants'
import { Stitch, RemoteMongoClient, AnonymousCredential, UserPasswordCredential, FunctionCredential } from 'mongodb-stitch-browser-sdk'

const StitchContext = createContext({})

const StitchWrapper = ({cluster=S.CLUSTER, database=S.DATABASE, collection=S.COLLECTION, accountsCollection=S.ACCOUNTS, children, credentials=null}) => {
  const [ stitch, setStitch ] = useState({})
  const [ creds, setCredentials ] = useState(credentials)
  const [ connecting, setConnecting ] = useState(false)
  const [ error, setError ] = useState(null)
  const [ user, setUser ] = useState(null)
  const [ anon, setAnon ] = useState(false)

  useEffect(() => {
    const client = Stitch.initializeDefaultAppClient(cluster)
    const root = client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas')
    const db = root.db(database)
    const game = db.collection(collection)
    const accounts = db.collection(accountsCollection)

    setStitch(s => ({
      client, root, db, game, accounts,
      setCredentials,
      logout: () => {
        client.auth.logout().then(() => {
          setUser(client.auth.user)
        })
      },
    }))

    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    const connect = async () => {
      if (stitch.client.auth.isLoggedIn) {
        await stitch.logout()
      }

      let via
      
      if (creds.type === 'anon') via = new AnonymousCredential()
      else if (creds.type === 'email') via = new UserPasswordCredential(creds.email, creds.password)
      else if (creds.type === 'function') via = new FunctionCredential(creds.payload)
      else {
        setConnecting(false)
        setError({name: "AuthError", message: "invalid auth method"})
        return
      }

      stitch.client.auth.loginWithCredential(via).then(user => {
        // console.log('connected with', via)
        setAnon(creds.type === 'anon')
        setUser(stitch.client.auth.user)
        setConnecting(false)
      }).catch(err => {
        // console.log('error', err)
        setError(err)
        setConnecting(false)
      })
    }

    if (stitch.client && !connecting && creds) {
      setConnecting(true)
      setError(false)
      connect()
    }
    // eslint-disable-next-line
  }, [creds])

  return (
    <StitchContext.Provider value={{...stitch, user, anon, connecting, error}}>
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

const useStitchWatcher = ({database=null, collection, onNext=(ev) => console.log(ev), compact=false, active=true, filter=[]}) => {
  const stitch = useContext(StitchContext)
  const [ ready, setReady ] = useState(false)
  const [ isActive, setActive ] = useState(active)
  const watcherRef = useRef(null)

  const activate = () => {
    !watcherRef.current && stitch.user && stitch.user.isLoggedIn && (database === null ? stitch.db : stitch.root.db(database)).collection(collection)[compact ? 'watchCompact' : 'watch'](filter).then(w => {
      console.log('opening watcher', w)
      w.onNext((ev) => onNext(ev, new Date ()))
      watcherRef.current = w
      setReady(true)
    })
  }

  const deactivate = () => {
    if (watcherRef.current) {
      console.log('closing watcher', watcherRef)
      watcherRef.current && watcherRef.current.close()
      setReady(false)
    }
  }

  useEffect(() => {
    if (isActive) activate()
    else deactivate()
    // eslint-disable-next-line
  }, [isActive])

  useEffect(() => {
    if (isActive) activate()
    return deactivate
    // eslint-disable-next-line
  }, [])

  return { ready, stream: watcherRef.current, setActive }
}

export default StitchWrapper
export { StitchContext, StitchWatcher, StitchWatcherContext, useStitchWatcher }