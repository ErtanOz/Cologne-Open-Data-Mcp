import type { XMLParser } from 'fast-xml-parser';

export type HttpFetch = typeof import('undici')['fetch'];

export interface ToolDependencies {
  fetch: HttpFetch;
  xmlParser: XMLParser;
}
