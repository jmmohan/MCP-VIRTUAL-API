/**
 * =====================================================================================
 * Ollama LLM Response Generator
 * =====================================================================================
 * 
 * @file        ollamaGenerator.js
 * @description This module provides intelligent mock API response generation using
 *              Ollama's LLM capabilities. It takes API schema definitions and generates
 *              realistic, contextually appropriate mock data that matches the expected
 *              response structure. The generator includes multiple JSON parsing strategies
 *              and robust fallback mechanisms to ensure reliable response generation.
 * 
 * @author      JMM
 * @version     1.0.0
 * @date        2025-01-07
 * 
 * @features    - Ollama LLM integration for intelligent mock data generation
 *              - Multiple JSON extraction strategies for robust parsing
 *              - Schema-based fallback response generation
 *              - Comprehensive error handling and logging
 *              - Support for various data types (string, number, boolean, enum)
 *              - Contextual response generation based on API purpose
 * 
 * @dependencies
 *              - axios: HTTP client for making requests to Ollama API
 *              - Ollama server running on localhost:11434 with llama3 model
 * 
 * @usage       import { generate } from './generators/ollamaGenerator.js';
 *              const response = await generate(schema, inputData);
 * 
 * @parameters  schema (Object): API schema containing:
 *              - endpoint: API endpoint path
 *              - method: HTTP method
 *              - context: Description of API purpose
 *              - responseSchema: Expected response structure
 *              
 *              input (Object): Input parameters (query params or request body)
 * 
 * @returns     Object: Generated mock response data or error object
 * 
 * @examples    
 *              const schema = {
 *                "endpoint": "/user/profile",
 *                "method": "GET",
 *                "context": "User profile information",
 *                "responseSchema": {
 *                  "id": "number",
 *                  "name": "string",
 *                  "email": "string"
 *                }
 *              };
 *              
 *              const result = await generate(schema, {});
 *              // Returns: { id: 123, name: "John Doe", email: "john@example.com" }
 * 
 * @license     MIT
 * =====================================================================================
 */

import axios from 'axios';

/**
 * Generates mock API responses using Ollama LLM
 * This function takes a schema definition and input parameters, then uses Ollama to generate
 * realistic mock data that matches the expected response structure
 * 
 * @param {Object} schema - The API schema definition containing endpoint, method, context, and responseSchema
 * @param {Object} input - Input parameters (query params for GET, body for POST/PUT)
 * @returns {Object} - Generated mock response data or error object
 */
export async function generate(schema, input = {}) {
  // Construct a detailed prompt for the LLM that emphasizes JSON-only output
  // The prompt is designed to be very specific about requirements to avoid conversational responses
  const prompt = `You are a mock API generator. Return ONLY valid JSON, no explanations or extra text.

Based on the following schema and context, generate a realistic mock response that matches the schema exactly.

Context: ${schema.context || "N/A"}
Schema: ${JSON.stringify(schema.responseSchema)}
Input: ${JSON.stringify(input)}

IMPORTANT: 
- Return ONLY valid JSON
- No explanations, comments, or additional text
- Match the schema structure exactly
- Use realistic sample data

JSON Response:`;

  // Initialize response variable outside try block so it's accessible in catch
  let response = null;
  
  try {
    // Make HTTP POST request to Ollama API
    // Ollama typically runs on localhost:11434 and uses the /api/generate endpoint
    response = await axios.post('http://localhost:11434/api/generate', {
      model: "llama3",        // Using llama3 model for generation
      prompt: prompt,         // Our carefully crafted prompt
      stream: false          // Non-streaming response for easier parsing
    });

    // Get the raw response content from Ollama
    let content = response.data.response.trim();
    console.log("Raw LLM response:", content);
    
    // Multiple JSON extraction strategies to handle different response formats
    // LLMs sometimes return JSON with additional text, so we need robust parsing
    let jsonContent = null;
    
    // Strategy 1: Extract JSON object using regex that captures everything between { and }
    // The [\s\S]* pattern matches any character including newlines
    const jsonMatch1 = content.match(/\{[\s\S]*\}/);
    if (jsonMatch1) {
      jsonContent = jsonMatch1[0];
    }
    
    // Strategy 2: Extract JSON array if no object was found
    // Some responses might return arrays instead of objects
    if (!jsonContent) {
      const jsonMatch2 = content.match(/\[[\s\S]*\]/);
      if (jsonMatch2) {
        jsonContent = jsonMatch2[0];
      }
    }
    
    // Strategy 3: Direct usage if content already starts with valid JSON
    // If the LLM followed instructions perfectly, the response starts with { or [
    if (!jsonContent && (content.startsWith('{') || content.startsWith('['))) {
      jsonContent = content;
    }
    
    // Strategy 4: Line-by-line search for JSON content
    // Sometimes JSON appears after some explanatory text
    if (!jsonContent) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('{') || line.startsWith('[')) {
          // Take all lines from this point onwards as potential JSON
          jsonContent = lines.slice(i).join('\n');
          break;
        }
      }
    }
    
    // If we found JSON content, try to parse it
    if (jsonContent) {
      return JSON.parse(jsonContent);
    } else {
      // If no JSON was found in the response, throw an error to trigger fallback
      throw new Error("No valid JSON found in response");
    }
    
  } catch (err) {
    // Comprehensive error logging for debugging
    console.error("LLM generation error:", err.message);
    console.error("Raw response:", response?.data?.response || "No response available");
    
    // Fallback response generation based on schema structure
    // This ensures the API always returns something useful even if LLM fails
    if (schema.responseSchema) {
      const fallback = {};

      // Determine source of properties depending on schema style
      const propEntries = schema.responseSchema.properties
        ? Object.entries(schema.responseSchema.properties)
        : Object.entries(schema.responseSchema);

      propEntries.forEach(([key, prop]) => {
        // When using simplified schema, prop may be a string like "string" or an object.
        const type = typeof prop === 'string' ? prop : prop.type;
        const enumVals = typeof prop === 'object' && prop.enum ? prop.enum : null;

        if (enumVals && enumVals.length) {
          fallback[key] = enumVals[0];
        } else if (type === 'string') {
          fallback[key] = `sample_${key}`;
        } else if (type === 'number') {
          fallback[key] = 123;
        } else if (type === 'boolean') {
          fallback[key] = true;
        } else {
          fallback[key] = `sample_${key}`;
        }
      });

      return fallback;
    }
    
    // Final fallback if no schema structure is available
    return { error: "Failed to generate mock response from LLM." };
  }
}
