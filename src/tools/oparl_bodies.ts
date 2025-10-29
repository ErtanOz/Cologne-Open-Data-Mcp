import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import type { ToolDependencies } from './types.js';
import { buildTextResult, buildErrorResult, formatAsJson, fetchWithTimeout, safeJsonParse } from './utils.js';

const DEFAULT_OPARL_URL = 'https://buergerinfo.stadt-koeln.de/oparl/bodies';

const BodyArgs = {
  id: z
    .string()
    .min(1, 'Please provide a valid Body ID or URL.')
    .describe('OParl Body ID (e.g., "0001") or complete URL.')
} as const;

export default function registerOparlTools(server: McpServer, deps: ToolDependencies): void {
  server.registerTool(
    'koeln.oparl.bodies',
    {
      description: 'Lists available OParl bodies for the city of Cologne.'
    },
    async () => {
      try {
        const url = process.env.OPARL_BODIES_URL ?? DEFAULT_OPARL_URL;
        const response = await fetchWithTimeout(deps.fetch, url, {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        });
        const text = await response.text();

        const payload = safeJsonParse(text) ?? text;

        return buildTextResult(
          formatAsJson({
            source: url,
            payload
          })
        );
      } catch (error) {
        return buildErrorResult(error, 'Failed to fetch OParl bodies');
      }
    }
  );

  server.registerTool(
    'koeln.oparl.body',
    {
      description: 'Retrieves a single OParl body object by ID or URL.',
      inputSchema: BodyArgs
    },
    async ({ id }) => {
      try {
        const baseUrl = process.env.OPARL_BODIES_URL ?? DEFAULT_OPARL_URL;

        let targetUrl: string;
        try {
          const resolved = new URL(id, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
          targetUrl = resolved.toString();
        } catch {
          targetUrl = `${baseUrl.replace(/\/$/, '')}/${id}`;
        }

        const response = await fetchWithTimeout(deps.fetch, targetUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        });
        const text = await response.text();

        const payload = safeJsonParse(text) ?? text;

        return buildTextResult(
          formatAsJson({
            source: targetUrl,
            payload
          })
        );
      } catch (error) {
        return buildErrorResult(error, 'Failed to fetch OParl body');
      }
    }
  );
}
