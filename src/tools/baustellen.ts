import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ToolDependencies } from './types.js';
import { buildTextResult, buildErrorResult, formatAsJson, fetchWithTimeout } from './utils.js';

const DEFAULT_WFS_URL =
  'https://geoportal.stadt-koeln.de/wss/service/baustellen_wfs/guest?SERVICE=WFS&REQUEST=GetCapabilities';

export default function registerBaustellenTool(server: McpServer, deps: ToolDependencies): void {
  server.registerTool(
    'koeln.baustellen_caps',
    {
      description:
        'Reads WFS GetCapabilities for construction sites in Cologne and returns structured XML response.'
    },
    async () => {
      try {
        const url = process.env.BAUSTELLEN_WFS ?? DEFAULT_WFS_URL;
        const response = await fetchWithTimeout(deps.fetch, url, { method: 'GET' });
        const xmlText = await response.text();

        let parsed: unknown;
        try {
          parsed = deps.xmlParser.parse(xmlText);
        } catch (error) {
          return buildErrorResult(error, 'Error parsing XML response');
        }

        return buildTextResult(
          formatAsJson({
            source: url,
            capabilities: parsed
          })
        );
      } catch (error) {
        return buildErrorResult(error, 'Failed to fetch construction site capabilities');
      }
    }
  );
}
