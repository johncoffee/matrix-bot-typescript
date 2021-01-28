import { AutojoinRoomsMixin, MatrixClient, SimpleFsStorageProvider, } from 'matrix-bot-sdk'
import { appendFile, readFileSync } from 'fs'
import { ensureDirSync, move, readdir, readJSON } from 'fs-extra'
import { getWeather } from './yr.no-api'

// where you would point a client to talk to a homeserver
const homeserverUrl = 'https://matrix.org'

// see https://t2bot.io/docs/access_tokens
const accessToken = readFileSync(__dirname + '/../tmp/access_token.txt').toString()

// We'll want to make sure the bot doesn't have to do an initial sync every
// time it restarts, so we need to prepare a storage provider. Here we use
// a simple JSON database.
ensureDirSync(__dirname + '/data')
const storage = new SimpleFsStorageProvider('data/hello-bot.json')

// Now we can create the client and set it up to automatically join rooms.
const client = new MatrixClient(homeserverUrl, accessToken, storage)
AutojoinRoomsMixin.setupOnClient(client)
client.start().then(() => {
  logger('Client started.')
})

client.on('room.message', (roomId, event) => {
  if (!event.content?.body) return

  logger(event['sender'] + ' says ' + event.content?.body)

  if (event.content.body.startsWith('!vejret')) {
    // init stuff
    getForecast(roomId)
  }
})

async function getForecast (roomId) {
  const latest = await getWeather()
  try {
    await client.sendHtmlText(roomId,
      `
      <p>5 day summary:</p>
       ${latest
        .map(day => Object.entries(day).map(([v, k]) =>
            `${k} ${v}`
          ).join('. ')
        )
        .join('<br>')
      }
     )}    
`)
  } catch (err) {
    logger('Weather job failed')
    logger(err)
    await client.sendNotice(roomId, 'Failed job: ' + err)
  }
}

async function runOtherJob2 (roomId, delay: number = 2000) {
  try {
    await client.sendNotice(roomId, 'Running job...')
    // if (Math.random() > .2) {
    //   await client.sendText(roomId, 'It was a nice.')
    // }
    const goodForecasts = await readdir(__dirname + '/inbox/good')
    if (Array.isArray(goodForecasts) && goodForecasts.length) {
      const f = goodForecasts.pop()
      const latest = await readJSON(__dirname + '/inbox/good/' + f)
      await client.sendHtmlText(roomId, `<pre>${JSON.stringify(latest, null, '  ')}</pre>`)
      await move(__dirname + '/inbox/good/' + f, __dirname + '/inbox/read/' + f)
    }
  } catch (e) {
    logger('Stopped job!')
    logger(e)
    return
  }

  setTimeout(() => runOtherJob2(roomId, delay), delay)
}

function logger (msg: string) {
  appendFile(__dirname + '/../tmp/log.txt',
    new Date().toJSON() + ' ' + JSON.stringify(msg, null, '  ') + '\n', console.error)
}