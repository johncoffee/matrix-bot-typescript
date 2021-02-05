import { AutojoinRoomsMixin, MatrixClient, SimpleFsStorageProvider, } from 'matrix-bot-sdk'
import { appendFile, readFileSync } from 'fs'
import { ensureDirSync, readFile, remove } from 'fs-extra'
import { join } from 'path'
import execa from 'execa'

// where you would point a client to talk to a homeserver
const homeserverUrl = 'https://matrix.org'

// see https://t2bot.io/docs/access_tokens
const accessToken = readFileSync(__dirname + '/../tmp/access_token.txt').toString()

// We'll want to make sure the bot doesn't have to do an initial sync every
// time it restarts, so we need to prepare a storage provider. Here we use
// a simple JSON database.

const cacheDir = '/tmp/weatherbot-cache'
ensureDirSync(cacheDir)

// const storage = new SimpleFsStorageProvider(cacheDir + '/weather-bot.json')
const storage = new SimpleFsStorageProvider(cacheDir + '/weather-bot.json')
// Now we can create the client and set it up to automatically join rooms.
const client = new MatrixClient(homeserverUrl, accessToken, storage)
AutojoinRoomsMixin.setupOnClient(client)

const rooms: string[] = []
client.start().then(async () => {
  rooms.push(...await client.getJoinedRooms())
  rooms.forEach((roomId, i, arr) => {
    client.sendNotice(roomId, 'bot started, rooms joined: ' + arr.join(', '))
  })

  rooms.forEach((roomId, i, arr) => {
  })

})

async function sendImage (path: string, roomId: string) {
  // file="$1"
  // 	content_type="$2"
  // 	filename="$3"
  // 	response=$( _curl -XPOST --data-binary "@$file" -H "Content-Type: $content_type" "${MATRIX_HOMESERVER}/_matrix/media/r0/upload?filename=${filename}" )
  const buf = await readFile(path)
  const urlMXC = await client.uploadContent(buf, 'image/png')
  logger(urlMXC)
  const content = {
    'body': 'screenshot ',
    'msgtype': 'm.image',
    'url': urlMXC,
  }
  logger('sending img...')

  await client.sendMessage(roomId, content)
    .then(res => logger(res))
    .catch(er => logger(er))
}

const targetFile = join(__dirname, '/cypress/screenshots/getWeather.spec.js/get weather -- should take a screenshot.png')

let refreshing: boolean = false

client.on('room.message', async (roomId, event) => {
  if (typeof event.content?.body !== 'string') return

  // logger(event['sender'] + ' says ' + event.content?.body)
  // logger(event.content.body)

  if (event.content.body.startsWith('!latest')) {
    // init stuff
    // await client.sendNotice(roomId, 'Running job...')
    // await client.sendHtmlText(roomId, `<pre>${JSON.stringify(event, null, '  ')}</pre>`)
    await sendImage(targetFile, roomId)
  }
  else if (event.content.body.startsWith('!weather cph')) {
    if (!refreshing) {
      refreshing = true
      await refresh()
      await sendImage(targetFile, roomId)
    }
  }

  async function refresh () {
    // init stuff
    await remove(targetFile)
    client.sendNotice(roomId, 'Running refresh...')

    try {
      execa('npx', ['cypress', 'run'], {
        cwd: __dirname,
        timeout: 15 * 1000,
      })
    } catch (error) {
      client.sendNotice(roomId, 'Refresh failed.')
      logger(error)
      return
    }

    logger("Didn't fail :)")
  }
})

function logger (msg: any) {
  appendFile(__dirname + '/../tmp/log.txt',
    new Date().toJSON() + ' ' + JSON.stringify(msg, null, '  ') + '\n', console.error)
}
