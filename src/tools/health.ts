import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import type { ToolDependencies } from './types.js';
import { buildTextResult } from './utils.js';

/**
 * Registers a simple health check tool endpoint.
 */
export default function registerHealthTool(server: McpServer, _deps: ToolDependencies): void {
  server.registerTool(
    'health',
    {
      description: 'Checks server status and optionally echoes a message back.',
      inputSchema: {
        echo: z
          .string()
          .optional()
          .describe('Optional text to echo back in the result.')
      }
    },
    async ({ echo }) => {
      const message = echo ?? 'OK - Server is responding.';
      return buildTextResult(message);
    }
  );
}
