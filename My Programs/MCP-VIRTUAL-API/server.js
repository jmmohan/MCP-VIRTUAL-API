/**
 * =====================================================================================
 * MCP Virtual API Server with Ollama Integration
 * =====================================================================================
 * 
 * @file        server.js
 * @description Main server file for the MCP Virtual API Server that dynamically creates
 *              API endpoints based on JSON schema files and uses Ollama LLM to generate
 *              realistic mock responses. This server reads schema definitions from the
 *              schemas directory and automatically registers REST API endpoints.
 * 
 * @author      JMM
 * @version     1.0.0
 * @date        2025-01-07
 * 
 * @features    - Dynamic API endpoint registration from JSON schemas
 *              - Ollama LLM integration for realistic mock data generation
 *              - Support for GET, POST, PUT, DELETE HTTP methods
 *              - Automatic JSON response formatting
 *              - Comprehensive error handling and logging
 *              - ES Module compatibility
 * 
 * @dependencies
 *              - express: Web framework for Node.js
 *              - body-parser: Middleware for parsing JSON request bodies
 *              - fs: File system operations
 *              - path: Path utilities
 *              - url: URL utilities for ES module compatibility
 *              - Custom ollamaGenerator module for LLM-based response generation
 * 
 * @usage       1. Place JSON schema files in the ./schemas directory
 *              2. Run: node server.js
 *              3. Server will automatically create API endpoints based on schemas
 *              4. Access endpoints at http://localhost:3000/[endpoint-path]
 * 
 * @schema      Each schema file should contain:
 *              {
 *                "endpoint": "/api/path",
 *                "method": "GET|POST|PUT|DELETE",
 *                "context": "Description of what this endpoint does",
 *                "responseSchema": { ... JSON schema for response structure ... }
 *              }
 * 
 * @license     MIT
 * =====================================================================================
 */

// Import required modules for Express server and file system operations
import express from 'express';           // Web framework for Node.js
import fs from 'fs';                     // File system module for reading files
import path from 'path';                 // Path utilities for working with file and directory paths
import { fileURLToPath } from 'url';     // Utility to convert file URLs to file paths (ES module compatibility)
import bodyParser from 'body-parser';    // Middleware to parse JSON request bodies
import { generate } from './generators/ollamaGenerator.js';  // Our custom LLM-based response generator

// ES Module compatibility: Create __dirname equivalent
// In ES modules, __dirname is not available, so we need to recreate it
const __filename = fileURLToPath(import.meta.url);  // Get current file path
const __dirname = path.dirname(__filename);         // Get directory of current file

// Initialize Express application and configuration
const app = express();
const PORT = 3000;  // Server port (changed from 4000 to avoid conflicts)

// Middleware configuration
app.use(bodyParser.json());  // Parse JSON request bodies automatically

// Dynamic API endpoint registration based on schema files
// This section reads all schema files and creates API endpoints dynamically

// Define the path to the schemas directory
const schemasDir = path.join(__dirname, 'schemas');

// Object to store all loaded schemas for reference
const schemas = {};

// -----------------------------------
// Helper: Register a schema as an API
// -----------------------------------
function registerEndpoint(schema) {
  // Guard: ensure schema has required fields
  if (!schema || typeof schema.endpoint !== 'string' || typeof schema.method !== 'string') {
    console.warn('⚠️  Skipping invalid schema:', schema);
    return;
  }

  const route = schema.endpoint;                     // e.g. '/customer/profile'
  const method = schema.method.toLowerCase();        // e.g. 'get', 'post'

  // Store schema for later retrieval
  schemas[`${method} ${route}`] = schema;

  // Create/attach the Express handler
  app[method](route, async (req, res) => {
    try {
      const input = method === 'get' ? req.query : req.body;
      const synthetic = await generate(schema, input);
      res.json(synthetic);
    } catch (err) {
      console.error('API endpoint error:', err);
      res.status(500).json({ error: 'Failed to generate synthetic response' });
    }
  });

  console.log(`✅ Registered virtual API: [${method.toUpperCase()}] ${route}`);
}

// Read all files in the schemas directory and process each one
fs.readdirSync(schemasDir).forEach(file => {
  // Only process .json files
  if (path.extname(file).toLowerCase() !== '.json') {
    return;
  }

  const schemaPath = path.join(schemasDir, file);
  try {
    const raw = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(raw);

    // Auto-fill minimal schema if required fields missing.
    if (!schema.endpoint) {
      // Derive endpoint path from file name e.g. customer_profile -> /customer/profile
      const base = path.parse(file).name; // without extension
      const route = '/' + base.replace(/__/g, '/').replace(/_/g, '/');
      schema.endpoint = route;
    }
    if (!schema.method) {
      schema.method = 'GET';
    }

    // If the schema appears to be purely a JSON schema (no responseSchema field), wrap it.
    if (!schema.responseSchema) {
      // Preserve any other top-level props besides endpoint/method/context
      const { endpoint, method, context, ...rest } = schema;
      schema.responseSchema = Object.keys(rest).length ? rest : {};
    }

    registerEndpoint(schema);
  } catch (err) {
    console.error(`Failed to load schema file ${file}:`, err.message);
  }
});

// Serve static assets (UI)
app.use(express.static(path.join(__dirname, 'public')));

// List all loaded schemas (for UI dropdown)
app.get('/schemas', (req, res) => {
  res.json(Object.values(schemas));
});

// Allow runtime addition of new schemas
app.post('/schemas', (req, res) => {
  const schema = req.body;

  // Basic validation
  if (!schema || !schema.endpoint || !schema.method || !schema.responseSchema) {
    return res.status(400).json({ error: 'Invalid schema format' });
  }

  try {
    // Persist the schema to disk so it survives restarts
    const safeName = schema.endpoint.replace(/\W+/g, '_').replace(/^_+|_+$/g, '') || 'schema';
    const filePath = path.join(schemasDir, `${Date.now()}_${safeName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(schema, null, 2), 'utf8');

    // Dynamically register the new endpoint
    registerEndpoint(schema);

    res.json({ message: 'Schema added successfully', endpoint: schema.endpoint });
  } catch (err) {
    console.error('Failed to save/register schema', err);
    res.status(500).json({ error: 'Failed to save/register schema' });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 MCP Virtual API Server with Ollama running at http://localhost:${PORT}`);
  console.log(`📁 Loaded ${Object.keys(schemas).length} API endpoint(s) from schemas directory`);
  console.log(`📋 Available endpoints:`);
  
  // Display all available endpoints for easy reference
  Object.keys(schemas).forEach(key => {
    const [method, route] = key.split(' ');
    console.log(`   ${method.toUpperCase()} http://localhost:${PORT}${route}`);
  });
});
