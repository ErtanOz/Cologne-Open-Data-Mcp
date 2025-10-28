import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import type { ToolDependencies } from './types.js';
import { buildTextResult, formatAsJson } from './utils.js';

const HttpGetArgs = {
  url: z.string().url('Bitte eine vollständige, gültige URL verwenden.'),
  headers: z
    .record(z.string())
    .optional()
    .describe('Optionale HTTP-Header (z. B. {"Accept": "application/json"}).')
} as const;

export default function registerHttpGetTool(server: McpServer, deps: ToolDependencies): void {
  server.registerTool(
    'http.get_json',
    {
      description: 'Führt einen HTTP GET aus und liefert Antwortdetails (JSON bevorzugt).',
      inputSchema: HttpGetArgs
    },
    async ({ url, headers }) => {
      const response = await deps.fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/*',
          ...headers
        }
      });

      const contentType = response.headers.get('content-type') ?? 'unbekannt';
      const bodyText = await response.text();

      let payload: unknown = bodyText;
      if (contentType.includes('json')) {
        try {
          payload = JSON.parse(bodyText);
        } catch {
          // Ignorieren, fallback ist bodyText.
        }
      }

      const info = {
        status: response.status,
        statusText: response.statusText,
        contentType,
        url: response.url,
        payload
      };

      return buildTextResult(formatAsJson(info));
    }
  );
}
