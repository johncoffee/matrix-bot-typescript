import { readFileSync, appendFile } from 'fs'
import { ensureDir, readdir, ensureFile, mkdirp, outputJSON, readJSON } from 'fs-extra'
import { getUnixTime } from 'date-fns'

const inbox = __dirname + '/inbox'
const readMsgs = inbox + '/read'
const goodMsgs = inbox + '/good'

runJob()
  .catch(err => console.error(err))

  setTimeout(() => {
    runOutputs()
      .catch(err => console.error(err))
  },1000)

export async function runOutputs() {
  await ensureDir(readMsgs)
  await ensureDir(goodMsgs)

  const jsonFiles = (await readdir(inbox))
    .filter(f => f.endsWith('.json'))

  const jsons = await Promise.all(
    jsonFiles.map(file => readJSON(inbox + "/"+file ) )
  )
  console.log(jsonFiles)

  const goodNews = jsons
    .filter(hour => !!hour.find(h => h.weather?.includes('sun')))
  console.log(goodNews)

  await Promise.all(
    goodNews.map( report => outputJSON(goodMsgs + '/' + getUnixTime(new Date()) + '.json', report, {spaces: "  "}))
  )
}

export async function runJob () {
  await ensureDir(inbox)

  const dataPoint = await mockService('')

  const data = dataPoint
  const p = inbox + '/'+ getUnixTime(new Date()) + '.json'
  await outputJSON(p, data, {spaces: "  "})
}

async function mockService(location) {
  const hours = new Array(24).fill(null)
    .map((_, idx) => {
      const hour = {
        localTimeDay: new Date().toJSON(),
        hour: idx,
        weather:
          (Math.random() > 0.4 ? 'sunny' : "overcast"),
        location: 'copenhagen Denmark',
        temperature: Math.floor(Math.random() * 5),
      }
      return hour
    })

  return hours
}