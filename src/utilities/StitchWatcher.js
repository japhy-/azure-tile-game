import { BSON } from 'mongodb-stitch-browser-sdk'

const subscriptions = {}

const connection = {
  subscribe: async ({channel=null, collection, eventHandler}) => {
    if (channel === null) {
      channel = new BSON.ObjectID ()
      console.log(`initiating new channel ${channel}`)
    }

    if (! subscriptions[channel.toString()]) await collection.watch({'fullDocument.channel': channel}).then(stream => {
      stream.onNext(eventHandler)
      subscriptions[channel.toString()] = { stream, collection }
    })

    console.log(`subscribing to ${channel}`)

    return {
      channel,
      publish: message => connection.publish({channel, message}),
      unsubscribe: () => connection.unsubscribe({channel}),
    }
  },

  publish: ({channel, message}) => {
    const { collection } = subscriptions[channel.toString()]

    if (collection) {
      console.log('writing message to collection', message, collection)
      
    }
  },

  unsubscribe: ({channel}) => {
    const { stream } = subscriptions[channel.toString()]

    if (stream) {
      console.log(`unsubscribing from ${channel}`)

      stream.close()
      delete subscriptions[channel.toString()]
    }
  },
}

export default connection