import React, { createContext, useEffect, useState } from 'react'

const ActionContext = createContext({})

const ActionWrapper = ({children}) => {
  const [ queue, setQueue ] = useState([])
  const [ newTasks, setNewTasks ] = useState(0)

  const addActions = (items) => {
    items = (Array.isArray(items) ? items : [items]).map(i => (
      React.isValidElement(i) && i.type.name === 'ActionEvent' ? i : (<ActionEvent desc={i.key} key={i.key} pause={i.pause || 0}>{i.event}</ActionEvent>)
    ))
    setQueue(q => [...q, ...items])
    setNewTasks(n => n+1)
  }

  return (
    <ActionContext.Provider value={addActions}>
      {children}
      <ActionQueue update={newTasks} queue={queue} setQueue={setQueue}></ActionQueue>
    </ActionContext.Provider>
  )
}

const ActionQueue = ({update, queue, setQueue}) => {
  let execute

  execute = () => {
    if (queue.length > 0) {
      const { pause, children: task } = queue.shift().props
      setQueue(q => q.slice(1))

      setTimeout(() => { task(); execute() }, pause)
    }
  }

  useEffect(() => {
    execute()
  // eslint-disable-next-line
  }, [update])

  return null
}

const ActionEvent = () => null

export default ActionWrapper
export { ActionEvent, ActionContext }