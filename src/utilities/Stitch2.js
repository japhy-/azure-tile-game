import React, { useState, createContext, useEffect } from 'react'
import { Stitch, RemoteMongoClient } from 'mongodb-stitch-browser-sdk'
import { useInterceptState } from './CustomHooks'

export const StitchContext = createContext({})

const StitchProvider = ({cluster, children}) => {
  const [ client, setClient ] = useState()
  const [ mongo, setMongo ] = useState()
  const [ user, updateUser ] = useInterceptState(() => (client && client.auth.user) || null)
  const [ isAuthed, updateIsAuthed ] = useInterceptState(() => (client && client.auth.isLoggedIn) || false)

  useEffect(() => {
    setClient( Stitch.initializeDefaultAppClient(cluster) )
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (client) {
      setMongo( client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas') )
      updateIsAuthed()
    }
    // eslint-disable-next-line
  }, [client])

  useEffect(() => {
    updateUser()
    // eslint-disable-next-line
  }, [isAuthed])

  return <StitchContext.Provider value={{
    login: async (cred) => {
      await client.auth.loginWithCredential(cred)
      updateIsAuthed()
    },
    logout: async () => {
      await client.auth.logout()
      updateIsAuthed()
    },
    mongo,
    isAuthed,
    user,
  }}>{children}</StitchContext.Provider>
}

export default StitchProvider
