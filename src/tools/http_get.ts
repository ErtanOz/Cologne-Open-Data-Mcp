import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import type { ToolDependencies } from './types.js';
import { buildTextResult, buildErrorResult, formatAsJson, fetchWithTimeout, safeJsonParse, isValidUrl } from './utils.js';

const HttpGetArgs = {
  url: z.string().url('Please provide a complete, valid URL.'),
  headers: z
    .record(z.string())
    .optional()
    .describe('Optional HTTP headers (e.g., {"Accept": "application/json"}).')
} as const;

export default function registerHttpGetTool(server: McpServer, deps: ToolDependencies): void {
  server.registerTool(
    'http.get_json',
    {
      description: 'Performs an HTTP GET request and returns response details (JSON preferred).',
      inputSchema: HttpGetArgs
    },
    async ({ url, headers }) => {
      try {
        // Validate URL to prevent SSRF attacks
        if (!isValidUrl(url)) {
          return buildErrorResult(
            new Error('Invalid URL: Only http/https protocols to public hosts are allowed'),
            'URL validation failed'
          );
        }

        // Sanitize custom headers to prevent header injection
        const sanitizedHeaders: Record<string, string> = {};
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            // Remove any newline characters to prevent header injection
            const cleanKey = key.replace(/[\r\n]/g, '');
            const cleanValue = value.replace(/[\r\n]/g, '');
            if (cleanKey && cleanValue) {
              sanitizedHeaders[cleanKey] = cleanValue;
            }
          }
        }

        const response = await fetchWithTimeout(deps.fetch, url, {
          method: 'GET',
          headers: {
            Accept: 'application/json, text/*',
            ...sanitizedHeaders
          }
        });

        const contentType = response.headers.get('content-type') ?? 'unknown';
        const bodyText = await response.text();

        let payload: unknown = bodyText;
        if (contentType.includes('json')) {
          payload = safeJsonParse(bodyText) ?? bodyText;
        }

        const info = {
          status: response.status,
          statusText: response.statusText,
          contentType,
          url: response.url,
          payload
        };

        return buildTextResult(formatAsJson(info));
      } catch (error) {
        return buildErrorResult(error, 'HTTP GET request failed');
      }
    }
  );
}
