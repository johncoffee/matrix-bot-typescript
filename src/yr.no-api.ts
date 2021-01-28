import yrnoForecast from 'yr.no-forecast'
import { writeJSON } from 'fs-extra'
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
