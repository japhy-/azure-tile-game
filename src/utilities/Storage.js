import React, { createContext, useRef } from 'react'
import { useInterceptState } from './CustomHooks'

export const StorageContext = createContext({})

export const useStorage = (method) => {
  const storage = useRef(method === 'local' ? localStorage : sessionStorage)
  const [ data, setData ] = useInterceptState((d) => Object.fromEntries(Object.entries(d).map(([k,v]) => [k, JSON.parse(v)])), storage.current)
  return {
    _data: data,
    _raw: storage.current,
    get: (k) => data[k],
    set: (k, v) => { storage.current.setItem(k, JSON.stringify(v)); setData(storage.current) },
    remove: (k) => { storage.current.removeItem(k); setData(storage.current) },
    clear: () => { storage.current.clear(); setData(storage.current) },
    length: () => storage.current.length,
    key: (n) => storage.current.key(n),
  }
}

export const useLocalStorage = () => useStorage('local')
export const useSessionStorage = () => useStorage('session')


export const Storage = ({method, children}) => {
  const storage = useStorage(method)

  return (
    <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>
  )
}

export const LocalStorage = ({children}) => <Storage method="local">{children}</Storage>
export const SessionStorage = ({children}) => <Storage method="session">{children}</Storage>

export default useStorage