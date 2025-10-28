import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ToolDependencies } from './types.js';
import { buildTextResult, formatAsJson } from './utils.js';

const DEFAULT_RHEINPEGEL_URL =
  'https://www.stadt-koeln.de/interne-dienste/hochwasser/pegel_ws.php';

export default function registerRheinpegelTool(server: McpServer, deps: ToolDependencies): void {
  server.registerTool(
    'koeln.rheinpegel',
    {
      description:
        'Liefert den aktuellen Rheinpegel (WS Pegeldienst) als JSON oder strukturierte Daten.'
    },
    async () => {
      const url = process.env.RHEINPEGEL_URL ?? DEFAULT_RHEINPEGEL_URL;
      const response = await deps.fetch(url, { method: 'GET' });
      const raw = await response.text();

      let payload: unknown = raw;

      try {
        payload = JSON.parse(raw);
      } catch {
        try {
          payload = deps.xmlParser.parse(raw);
        } catch {
          // Rohtext als Fallback.
        }
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
