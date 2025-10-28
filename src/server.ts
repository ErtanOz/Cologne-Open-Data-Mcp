import 'dotenv/config';
import { z } from 'zod';
import { fetch } from 'undici';
import { XMLParser } from 'fast-xml-parser';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';

import type { ToolDependencies } from './tools/types.js';
import registerHealthTool from './tools/health.js';
import registerHttpGetTool from './tools/http_get.js';
import registerParkingTool from './tools/parking.js';
import registerBaustellenTool from './tools/baustellen.js';
import registerRheinpegelTool from './tools/rheinpegel.js';
import registerKvbRadTool from './tools/kvb_rad.js';
import registerOparlTools from './tools/oparl_bodies.js';

// Beschreibender Hinweis für Clients – validiert über Zod, damit die Abhängigkeit genutzt wird.
const instructions = z
  .string()
  .parse(
    [
      'Kölner Open-Data MCP-Server',
      '',
      'Verfügbare Werkzeuge:',
      '- health: einfacher Statuscheck.',
      '- http.get_json: HTTP GET für beliebige JSON/REST-Endpunkte.',
      '- koeln.parking: Parkhausauslastung.',
      '- koeln.baustellen_caps: Baustellen-WFS GetCapabilities.',
      '- koeln.rheinpegel: Rheinpegelinformationen.',
      '- koeln.kvb_rad.stations: KVB-Rad-Stationen.',
      '- koeln.oparl.bodies/oparl.body: Politische Gremien gem. OParl.'
    ].join('\n')
  );

const mcpServer = new McpServer(
  {
    name: 'cologne-open-data-mcp',
    version: '0.1.0'
  },
  { instructions }
);

// Gemeinsame Hilfsobjekte für die Werkzeuge (HTTP-Client, XML-Parser).
const toolDependencies: ToolDependencies = {
  fetch,
  xmlParser: new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: 'value',
    allowBooleanAttributes: true
  })
};

// Registrierung aller Werkzeuge in separaten Modulen.
registerHealthTool(mcpServer, toolDependencies);
registerHttpGetTool(mcpServer, toolDependencies);
registerParkingTool(mcpServer, toolDependencies);
registerBaustellenTool(mcpServer, toolDependencies);
registerRheinpegelTool(mcpServer, toolDependencies);
registerKvbRadTool(mcpServer, toolDependencies);
registerOparlTools(mcpServer, toolDependencies);

async function main() {
  const transport = new StdioServerTransport();
  // Start des Servers über STDIO – geeignet für den MCP-Einsatz in Tools.
  await mcpServer.connect(transport);
  console.log('✅ MCP-Server läuft: Cologne-Open-Data-Mcp ready on stdio.');
}

main().catch((error) => {
  console.error('❌ Fehler beim Start des MCP-Servers:', error);
  process.exit(1);
});
