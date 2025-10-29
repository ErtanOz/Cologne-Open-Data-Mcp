import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ToolDependencies } from './types.js';
import { buildTextResult, buildErrorResult, formatAsJson, fetchWithTimeout, safeJsonParse } from './utils.js';

const DEFAULT_RHEINPEGEL_URL =
  'https://www.stadt-koeln.de/interne-dienste/hochwasser/pegel_ws.php';

export default function registerRheinpegelTool(server: McpServer, deps: ToolDependencies): void {
  server.registerTool(
    'koeln.rheinpegel',
    {
      description:
        'Returns current Rhine water level (gauge service) as JSON or structured data.'
    },
    async () => {
      try {
        const url = process.env.RHEINPEGEL_URL ?? DEFAULT_RHEINPEGEL_URL;
        const response = await fetchWithTimeout(deps.fetch, url, { method: 'GET' });
        const raw = await response.text();

        let payload: unknown = safeJsonParse(raw);

        if (!payload) {
          try {
            payload = deps.xmlParser.parse(raw);
          } catch {
            payload = raw;
          }
        }

        return buildTextResult(
          formatAsJson({
            source: url,
            payload
          })
        );
      } catch (error) {
        return buildErrorResult(error, 'Failed to fetch Rhine water level data');
      }
    }
  );
}
