import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import type { ToolDependencies } from './types.js';
import { buildTextResult, formatAsJson } from './utils.js';

const DEFAULT_OPARL_URL = 'https://buergerinfo.stadt-koeln.de/oparl/bodies';

const BodyArgs = {
  id: z
    .string()
    .min(1, 'Bitte eine gültige Body-ID oder URL angeben.')
    .describe('OParl Body-ID (z. B. "0001") oder vollständige URL.')
} as const;

export default function registerOparlTools(server: McpServer, deps: ToolDependencies): void {
  server.registerTool(
    'koeln.oparl.bodies',
    {
      description: 'Listet die verfügbaren OParl Bodies der Stadt Köln auf.'
    },
    async () => {
      const url = process.env.OPARL_BODIES_URL ?? DEFAULT_OPARL_URL;
      const response = await deps.fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });
      const text = await response.text();

      let payload: unknown = text;
      try {
        payload = JSON.parse(text);
      } catch {
        // Rohtext als Fallback.
      }

      return buildTextResult(
        formatAsJson({
          source: url,
          payload
        })
      );
    }
  );

  server.registerTool(
    'koeln.oparl.body',
    {
      description: 'Liest ein einzelnes OParl Body-Objekt anhand seiner ID oder URL.',
      inputSchema: BodyArgs
    },
    async ({ id }) => {
      const baseUrl = process.env.OPARL_BODIES_URL ?? DEFAULT_OPARL_URL;

      let targetUrl: string;
      try {
        const resolved = new URL(id, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
        targetUrl = resolved.toString();
      } catch {
        targetUrl = `${baseUrl.replace(/\/$/, '')}/${id}`;
      }

      const response = await deps.fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });
      const text = await response.text();

      let payload: unknown = text;
      try {
        payload = JSON.parse(text);
      } catch {
        // Rohtext als Fallback.
      }

      return buildTextResult(
        formatAsJson({
          source: targetUrl,
          payload
        })
      );
    }
  );
}
