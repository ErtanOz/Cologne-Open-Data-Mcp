import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ToolDependencies } from './types.js';
import { buildTextResult, formatAsJson } from './utils.js';

const DEFAULT_PARKING_URL =
  'https://www.stadt-koeln.de/externe-dienste/open-data/parking.php';

export default function registerParkingTool(server: McpServer, deps: ToolDependencies): void {
  server.registerTool(
    'koeln.parking',
    {
      description:
        'Liefert den aktuellen Parkhausstatus der Stadt Köln (frei/verfügbar je Anlage).'
    },
    async () => {
      const url = process.env.PARKING_URL ?? DEFAULT_PARKING_URL;
      const response = await deps.fetch(url, { method: 'GET' });
      const text = await response.text();

      let payload: unknown = text;
      try {
        payload = JSON.parse(text);
      } catch {
        // Falls API kein JSON liefert, bleibt Rohtext erhalten.
      }

      return buildTextResult(
        formatAsJson({
          source: url,
          payload
        })
      );
    }
  );
}
