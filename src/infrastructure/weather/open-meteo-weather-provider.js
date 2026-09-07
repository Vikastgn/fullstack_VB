/** Adapter for the free Open-Meteo geocoding and forecast APIs. */
export class OpenMeteoWeatherProvider {
  constructor({ fetchImpl = fetch }) {
    this.fetch = fetchImpl;
  }

  async getForecast(city) {
    const location = await this.findCity(city);
    if (!location) return null;

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: location.latitude,
      longitude: location.longitude,
      current: 'temperature_2m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      forecast_days: '3',
      timezone: 'auto'
    }).toString();
    const response = await this.fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`Open-Meteo forecast returned HTTP ${response.status}`);
    const data = await response.json();

    return {
      city: location.name,
      current: { temperature: data.current.temperature_2m, weatherCode: data.current.weather_code },
      days: data.daily.time.map((date, index) => ({
        date,
        weatherCode: data.daily.weather_code[index],
        maxTemperature: data.daily.temperature_2m_max[index],
        minTemperature: data.daily.temperature_2m_min[index]
      }))
    };
  }

  async findCity(name) {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.search = new URLSearchParams({ name, count: '1', language: 'ru', format: 'json' }).toString();
    const response = await this.fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`Open-Meteo geocoding returned HTTP ${response.status}`);
    const data = await response.json();
    const result = data.results?.[0];
    return result && { name: result.name, latitude: result.latitude, longitude: result.longitude };
  }
}
