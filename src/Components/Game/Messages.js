import React, { useContext } from 'react'
import { GameContext } from '.'

const Messages = () => {
  const { messages } = useContext(GameContext)
  return (
    <div className="Messages flex columns just-centered">
      {messages.get && messages.get.map((message, i) => (<div key={`message-${i}`} className={`Message Message-${i+1} centered`}>{message}</div>))}
    </div>
  )
}

export default Messages