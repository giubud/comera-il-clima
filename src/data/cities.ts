export type City = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export const cities = [
  { id: 'torino', name: 'Torino', latitude: 45.0703, longitude: 7.6869 },
  { id: 'milano', name: 'Milano', latitude: 45.4642, longitude: 9.19 },
  { id: 'venezia', name: 'Venezia', latitude: 45.4408, longitude: 12.3155 },
  { id: 'bologna', name: 'Bologna', latitude: 44.4949, longitude: 11.3426 },
  { id: 'firenze', name: 'Firenze', latitude: 43.7696, longitude: 11.2558 },
  { id: 'roma', name: 'Roma', latitude: 41.9028, longitude: 12.4964 },
  { id: 'napoli', name: 'Napoli', latitude: 40.8518, longitude: 14.2681 },
  { id: 'bari', name: 'Bari', latitude: 41.1171, longitude: 16.8719 },
  { id: 'palermo', name: 'Palermo', latitude: 38.1157, longitude: 13.3615 },
  { id: 'cagliari', name: 'Cagliari', latitude: 39.2238, longitude: 9.1217 },
] as const satisfies readonly City[];

export type CityId = (typeof cities)[number]['id'];

export function getCity(cityId: string): (typeof cities)[number] | undefined {
  return cities.find((city) => city.id === cityId);
}

