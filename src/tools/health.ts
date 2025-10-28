import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import type { ToolDependencies } from './types.js';
import { buildTextResult } from './utils.js';

/**
 * Registriert einen einfachen Health-Check-Toolendpunkt.
 */
export default function registerHealthTool(server: McpServer, _deps: ToolDependencies): void {
  server.registerTool(
    'health',
    {
      description: 'Prüft den Zustand des Servers und spiegelt optional eine Nachricht zurück.',
      inputSchema: {
        echo: z
          .string()
          .optional()
          .describe('Optionaler Text, der im Ergebnis wieder ausgegeben wird.')
      }
    },
    async ({ echo }) => {
      const message = echo ?? 'OK – Server antwortet.';
      return buildTextResult(message);
    }
  );
}
