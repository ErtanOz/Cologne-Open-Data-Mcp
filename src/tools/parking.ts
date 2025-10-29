import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ToolDependencies } from './types.js';
import { buildTextResult, buildErrorResult, formatAsJson, fetchWithTimeout, safeJsonParse } from './utils.js';

const DEFAULT_PARKING_URL =
  'https://www.stadt-koeln.de/externe-dienste/open-data/parking.php';

export default function registerParkingTool(server: McpServer, deps: ToolDependencies): void {
  server.registerTool(
    'koeln.parking',
    {
      description:
        'Returns current parking status for Cologne (available/occupied per facility).'
    },
    async () => {
      try {
        const url = process.env.PARKING_URL ?? DEFAULT_PARKING_URL;
        const response = await fetchWithTimeout(deps.fetch, url, { method: 'GET' });
        const text = await response.text();

        const payload = safeJsonParse(text) ?? text;

        return buildTextResult(
          formatAsJson({
            source: url,
            payload
          })
        );
      } catch (error) {
        return buildErrorResult(error, 'Failed to fetch parking data');
      }
    }
  );
}
