import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { fetch } from 'undici';
import { XMLParser } from 'fast-xml-parser';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

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
      'Cologne Open Data MCP Server (SSE)',
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

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (adjust in production)
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'cologne-open-data-mcp',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// SSE endpoint for MCP
app.get('/sse', async (req, res) => {
  console.error('New SSE connection established');

  const mcpServer = new McpServer(
    {
      name: 'cologne-open-data-mcp',
      version: '0.1.0'
    },
    { instructions }
  );

  // Register all tools
  registerHealthTool(mcpServer, toolDependencies);
  registerHttpGetTool(mcpServer, toolDependencies);
  registerParkingTool(mcpServer, toolDependencies);
  registerBaustellenTool(mcpServer, toolDependencies);
  registerRheinpegelTool(mcpServer, toolDependencies);
  registerKvbRadTool(mcpServer, toolDependencies);
  registerOparlTools(mcpServer, toolDependencies);

  const transport = new SSEServerTransport('/message', res);
  await mcpServer.connect(transport);

  // Handle client disconnect
  req.on('close', () => {
    console.error('SSE connection closed');
  });
});

// POST endpoint for receiving messages
app.post('/message', async (req, res) => {
  console.error('Received message:', JSON.stringify(req.body, null, 2));
  
  // The SSE transport will handle the actual message processing
  // This endpoint just needs to acknowledge receipt
  res.status(202).json({ status: 'accepted' });
});

// Root endpoint with API documentation
app.get('/', (_req, res) => {
  res.json({
    name: 'Cologne Open Data MCP Server',
    version: '0.1.0',
    description: 'Model Context Protocol server providing access to Cologne Open Data APIs',
    endpoints: {
      '/health': 'GET - Health check',
      '/sse': 'GET - SSE connection for MCP communication',
      '/message': 'POST - Send messages to MCP server'
    },
    repository: 'https://github.com/ErtanOz/Cologne-Open-Data-Mcp',
    documentation: 'https://github.com/ErtanOz/Cologne-Open-Data-Mcp#readme'
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.error(`✅ MCP Server (SSE) running on port ${PORT}`);
  console.error(`📍 SSE endpoint: http://localhost:${PORT}/sse`);
  console.error(`🏥 Health check: http://localhost:${PORT}/health`);
});