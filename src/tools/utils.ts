import type { HttpFetch } from './types.js';

/**
 * Formats a value as pretty-printed JSON string.
 */
export function formatAsJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return `JSON.stringify failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Builds a standard MCP text result object.
 */
export function buildTextResult(text: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text
      }
    ]
  };
}

/**
 * Ensures a value is an array, handling undefined and single values.
 */
export function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Validates if a URL is safe for fetching (prevents SSRF attacks).
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    // Prevent localhost and private IP ranges
    const hostname = url.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^\[?::1\]?$/,
      /^\[?fe80:/i
    ];
    
    return !privatePatterns.some(pattern => pattern.test(hostname));
  } catch {
    return false;
  }
}

/**
 * Fetches a URL with timeout and error handling.
 */
export async function fetchWithTimeout(
  fetch: HttpFetch,
  url: string,
  options: Parameters<HttpFetch>[1] = {},
  timeoutMs: number = 10000
): Promise<Awaited<ReturnType<HttpFetch>>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    } as Parameters<HttpFetch>[1]);
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(
        `HTTP error ${response.status}: ${response.statusText} for ${url}`
      );
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms for ${url}`);
      }
      throw new Error(`Fetch error for ${url}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Safely parses JSON with error handling.
 */
export function safeJsonParse<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Creates an error result in MCP format.
 */
export function buildErrorResult(error: unknown, context?: string): ReturnType<typeof buildTextResult> {
  const message = error instanceof Error ? error.message : String(error);
  const fullMessage = context ? `${context}: ${message}` : message;
  
  return buildTextResult(
    formatAsJson({
      error: true,
      message: fullMessage,
      timestamp: new Date().toISOString()
    })
  );
}
