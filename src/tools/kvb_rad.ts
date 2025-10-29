import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import type { ToolDependencies } from './types.js';
import { buildTextResult, buildErrorResult, ensureArray, formatAsJson, fetchWithTimeout } from './utils.js';

interface NextbikePlace {
  uid?: string | number;
  id?: string | number;
  name?: string;
  bikes?: string | number;
  booked_bikes?: string | number;
  free_racks?: string | number;
  active_place?: string | number;
  lat?: string | number;
  lng?: string | number;
  number?: string | number;
}

interface NextbikeCity {
  place?: NextbikePlace | NextbikePlace[];
}

interface NextbikeCountry {
  city?: NextbikeCity | NextbikeCity[];
}

interface NextbikeMarkers {
  country?: NextbikeCountry;
}

interface NextbikeParsed {
  markers?: NextbikeMarkers;
}

const DEFAULT_NEXTBIKE_URL =
  'https://api.nextbike.net/maps/nextbike-live.xml?city=14';

const KvbRadArgs = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .describe('Maximale Anzahl Stationen im Ergebnis (Standard: 25).'),
  onlyActive: z
    .boolean()
    .optional()
    .describe('Wenn true, werden nur aktive Stationen mit Fahrrädern ausgegeben.')
} as const;

export default function registerKvbRadTool(server: McpServer, deps: ToolDependencies): void {
  server.registerTool(
    'koeln.kvb_rad.stations',
    {
      description: 'Listet verfügbare KVB-Rad Stationen aus der Nextbike-API.',
      inputSchema: KvbRadArgs
    },
    async ({ limit = 25, onlyActive = true }) => {
      try {
        const url = process.env.NEXTBIKE_URL ?? DEFAULT_NEXTBIKE_URL;
        const response = await fetchWithTimeout(deps.fetch, url, { method: 'GET' });
        const xmlText = await response.text();

        let parsed: NextbikeParsed;
        try {
          parsed = deps.xmlParser.parse(xmlText) as NextbikeParsed;
        } catch (error) {
          return buildErrorResult(error, 'Error parsing XML feed');
        }

        const country = parsed?.markers?.country;
        const cityNode = Array.isArray(country?.city) ? country.city[0] : country?.city;
        const places = ensureArray<NextbikePlace>(cityNode?.place);

        const stations = places
          .map((place) => {
            const bikes = Number.parseInt(String(place.bikes ?? place.booked_bikes ?? '0'), 10);
            const freeRacks = Number.isNaN(Number(place.free_racks))
              ? null
              : Number(place.free_racks);
            return {
              id: String(place.uid ?? place.id ?? ''),
              name: String(place.name ?? ''),
              bikes,
              freeRacks,
              active: place.active_place === '1' || place.active_place === 1,
              lat: Number(place.lat),
              lng: Number(place.lng),
              number: place.number ? String(place.number) : undefined
            };
          })
          .filter((station) => {
            if (!onlyActive) {
              return true;
            }
            return station.active && (station.bikes > 0 || station.freeRacks !== null);
          })
          .slice(0, limit);

        return buildTextResult(
          formatAsJson({
            source: url,
            totalStations: places.length,
            returnedStations: stations.length,
            stations
          })
        );
      } catch (error) {
        return buildErrorResult(error, 'Failed to fetch KVB-Rad stations');
      }
    }
  );
}
