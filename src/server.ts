import 'dotenv/config';
import { z } from 'zod';
import { fetch } from 'undici';
import { XMLParser } from 'fast-xml-parser';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import type { ToolDependencies } from './tools/types.js';
import registerHealthTool from './tools/health.js';
import registerHttpGetTool from './tools/http_get.js';
import registerParkingTool from './tools/parking.js';
import registerBaustellenTool from './tools/baustellen.js';
import registerRheinpegelTool from './tools/rheinpegel.js';
import registerKvbRadTool from './tools/kvb_rad.js';
import registerOparlTools from './tools/oparl_bodies.js';

// Descriptive instructions for clients - validated with Zod.
const instructions = z
  .string()
  .parse(
    [
      'Cologne Open Data MCP Server',
      '',
      'Available tools:',
      '- health: Simple status check',
      '- http.get_json: HTTP GET for arbitrary JSON/REST endpoints',
      '- koeln.parking: Parking facility occupancy',
      '- koeln.baustellen_caps: Construction sites WFS GetCapabilities',
      '- koeln.rheinpegel: Rhine water level information',
      '- koeln.kvb_rad.stations: KVB bike sharing stations',
      '- koeln.oparl.bodies/body: Political bodies according to OParl specification'
    ].join('\n')
  );

const mcpServer = new McpServer(
  {
    name: 'cologne-open-data-mcp',
    version: '0.1.0'
  },
  { instructions }
);

// Shared utility objects for tools (HTTP client, XML parser).
const toolDependencies: ToolDependencies = {
  fetch,
  xmlParser: new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: 'value',
    allowBooleanAttributes: true
  })
};

// Register all tools from separate modules.
registerHealthTool(mcpServer, toolDependencies);
registerHttpGetTool(mcpServer, toolDependencies);
registerParkingTool(mcpServer, toolDependencies);
registerBaustellenTool(mcpServer, toolDependencies);
registerRheinpegelTool(mcpServer, toolDependencies);
registerKvbRadTool(mcpServer, toolDependencies);
registerOparlTools(mcpServer, toolDependencies);

async function main() {
  const transport = new StdioServerTransport();
  // Start server via STDIO - suitable for MCP use in tools.
  await mcpServer.connect(transport);
  console.error('✅ MCP Server running: Cologne-Open-Data-MCP ready on stdio.');
}

main().catch((error) => {
  console.error('❌ Error starting MCP server:', error);
  process.exit(1);
});
