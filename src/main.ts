import {
  MatrixClient,
  SimpleFsStorageProvider,
  AutojoinRoomsMixin,
  RichReply,
} from 'matrix-bot-sdk'
import { readFileSync, appendFile } from 'fs'

// where you would point a client to talk to a homeserver
const homeserverUrl = 'https://matrix.org'

// see https://t2bot.io/docs/access_tokens
const accessToken = readFileSync(__dirname + '/../tmp/access_token.txt').toString()

// We'll want to make sure the bot doesn't have to do an initial sync every
// time it restarts, so we need to prepare a storage provider. Here we use
// a simple JSON database.
const storage = new SimpleFsStorageProvider('hello-bot.json')

// Now we can create the client and set it up to automatically join rooms.
const client = new MatrixClient(homeserverUrl, accessToken, storage)
AutojoinRoomsMixin.setupOnClient(client)

// To listen for room messages (m.room.message) only:
client.on('room.message', async (roomId, event) => {
  if (!event.content?.body) return

  logger(event['sender'] + ' says ' + event.content?.body)

  // client.sendMessage(roomId, {
  //   "msgtype": "m.notice",
  //   "body": "hello!",
  // });

  if (event.content.body.startsWith('!hello')) {
    const res = await client.sendNotice(roomId, 'Hello you')
    logger(res)
  }

})

// Now that the client is all set up and the event handler is registered, start the
// client up. This will start it syncing.
client.start().then(() => logger('Client started!'))

// This is our event handler for dealing with the `!hello` command.
async function handleCommand (roomId, event) {
  // Don't handle events that don't have contents (they were probably redacted)
  if (!event['content']) return logger('no content?')

  // Don't handle non-text events
  if (event['content']['msgtype'] !== 'm.text') return

  // We never send `m.text` messages so this isn't required, however this is
  // how you would filter out events sent by the bot itself.
  if (event['sender'] === await client.getUserId()) return

  // Make sure that the event looks like a command we're expecting

  logger('event.content')
  logger(event.content)

  const body = event['content']['body']
  if (!body || !body.startsWith('!hello')) return

  // If we've reached this point, we can safely execute the command. We'll
  // send a reply to the user's command saying "Hello World!".
  const replyBody = 'Hello World!' // we don't have any special styling to do.
  const reply = RichReply.createFor(roomId, event, replyBody, replyBody)
  reply['msgtype'] = 'm.notice'
  client.sendMessage(roomId, reply)
}

function logger (msg: string) {
  appendFile(__dirname+'/../tmp/log.txt',
    new Date().toJSON() + " " + JSON.stringify(msg,null,'  ') + "\n", console.error)
}