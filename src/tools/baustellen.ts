import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ToolDependencies } from './types.js';
import { buildTextResult, formatAsJson } from './utils.js';

const DEFAULT_WFS_URL =
  'https://geoportal.stadt-koeln.de/wss/service/baustellen_wfs/guest?SERVICE=WFS&REQUEST=GetCapabilities';

export default function registerBaustellenTool(server: McpServer, deps: ToolDependencies): void {
  server.registerTool(
    'koeln.baustellen_caps',
    {
      description:
        'Liest die WFS GetCapabilities für Baustellen in Köln aus und liefert die strukturierte XML-Antwort.'
    },
    async () => {
      const url = process.env.BAUSTELLEN_WFS ?? DEFAULT_WFS_URL;
      const response = await deps.fetch(url, { method: 'GET' });
      const xmlText = await response.text();

      let parsed: unknown = xmlText;
      try {
        parsed = deps.xmlParser.parse(xmlText);
      } catch (error) {
        return buildTextResult(
          `Fehler beim Parsen der XML-Antwort: ${
            error instanceof Error ? error.message : String(error)
          }\n\nOriginal:\n${xmlText}`
        );
      }

      return buildTextResult(
        formatAsJson({
          source: url,
          capabilities: parsed
        })
      );
    }
  );
}
