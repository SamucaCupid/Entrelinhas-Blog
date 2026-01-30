export async function getTemperature(): Promise<string> {
  try {
    const lat = -14.8615;
    const lon = -40.8442;
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius&timezone=America/Bahia`,
      { next: { revalidate: 600 } },
    );

    if (!res.ok) return "--C";

    const data = await res.json();
    const temp = data?.current_weather?.temperature;

    if (typeof temp !== "number") return "--C";

    return `${Math.round(temp)}C`;
  } catch {
    return "--C";
  }
}
