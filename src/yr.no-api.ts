import yrnoForecast from 'yr.no-forecast'
import { appendFile, readdir, writeJSON } from 'fs-extra'
import {getUnixTime} from 'date-fns'
import assert from 'assert'

const yrnoClient = yrnoForecast({
  version: '1.9', // this is the default if not provided,
})

const CPH = {
  lat: 55.6772,
  lon: 12.589,
}

getWeather()

export async function getWeather(latLng = CPH) {
  try {
    const weather = await yrnoClient.getWeather(CPH)
    const fiveDaySummary = await weather.getFiveDaySummary()
    const startDate = fiveDaySummary?.[0].from
    assert(startDate)
    // console.log(fiveDaySummary)
    console.log("Done")
    // write cache
    writeJSON(__dirname + '/data/' + startDate.substr(0, startDate.indexOf("T"))  + ".json", fiveDaySummary, {spaces: '  '})

    // nicer formatting
    const formatted = fiveDaySummary.map(formatDay)
    return formatted
  }
  catch (e) {
    console.error(e)
  }
}

// async function getForecast (roomId) {
//   const latest = await getWeather()
//   try {
//     await client.sendHtmlText(roomId,
//       `
//       <p>5 day summary:</p>
//        ${latest
//         .map(day => Object.entries(day).map(([v, k]) =>
//             `${k} ${v}`
//           ).join('. ')
//         )
//         .join('<br>')
//       }
//      )}
// `)
//   } catch (err) {
//     logger('Weather job failed')
//     logger(err)
//     await client.sendNotice(roomId, 'Failed job: ' + err)
//   }
// }

// async function runOtherJob2 (client:any, roomId, delay: number = 2000) {
//   try {
//     await client.sendNotice(roomId, 'Running job...')
//     // if (Math.random() > .2) {
//     //   await client.sendText(roomId, 'It was a nice.')
//     // }
//     const goodForecasts = await readdir(__dirname + '/inbox/good')
//     if (Array.isArray(goodForecasts) && goodForecasts.length) {
//       const f = goodForecasts.pop()
//       const latest = await readJSON(__dirname + '/inbox/good/' + f)
//       await client.sendHtmlText(roomId, `<pre>${JSON.stringify(latest, null, '  ')}</pre>`)
//       await move(__dirname + '/inbox/good/' + f, __dirname + '/inbox/read/' + f)
//     }
//   } catch (e) {
//     logger('Stopped job!')
//     logger(e)
//     return
//   }
//
//   setTimeout(() => runOtherJob2(roomId, delay), delay)
// }

function logger (msg: string) {
  appendFile(__dirname + '/../tmp/log.txt',
    new Date().toJSON() + ' ' + JSON.stringify(msg, null, '  ') + '\n', console.error)
}

function formatDay(f) {
  return {
    date: f.from.substr(0, f.from.indexOf("T")),
    icon: `${f.icon}`,
    clouds: `${f.cloudiness.percent}%`,
    temperature: `${f.temperature.value} ${f.temperature.unit}`,
    rain: `${f.rainDetails.minRain}-${f.rainDetails.maxRain} ${f.rainDetails.unit}`,
    wind: `${f.windSpeed.name} ${f.windDirection.name}`
  }
}
