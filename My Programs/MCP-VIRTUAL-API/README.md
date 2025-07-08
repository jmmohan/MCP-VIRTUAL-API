# MCP Virtual API Server with Ollama Integration

A dynamic mock API server that automatically creates REST endpoints based on JSON schema files and uses Ollama LLM to generate realistic mock responses.

## 🚀 Features

- **Dynamic API Generation**: Automatically creates REST endpoints from JSON schema files
- **Ollama LLM Integration**: Uses Ollama's llama3 model for intelligent mock data generation
- **Multiple HTTP Methods**: Supports GET, POST, PUT, DELETE operations
- **Robust JSON Parsing**: Multiple strategies for extracting JSON from LLM responses
- **Schema-based Fallbacks**: Generates appropriate fallback responses when LLM fails
- **Real-time Logging**: Comprehensive logging for debugging and monitoring
- **ES Module Support**: Modern JavaScript with ES module compatibility

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Ollama** server running on `localhost:11434`
- **llama3** model installed in Ollama

### Installing Ollama and llama3

1. Install Ollama from [https://ollama.com](https://ollama.com)
2. Install the llama3 model:
   ```bash
   ollama pull llama3
   ```
3. Start Ollama server:
   ```bash
   ollama serve
   ```

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mcp-virtual-api.git
   cd mcp-virtual-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000`

## 📂 Project Structure

```
mcp-virtual-api/
├── server.js                 # Main server file
├── generators/
│   └── ollamaGenerator.js    # LLM response generator
├── schemas/
│   └── customer_profile.json # Example schema file
├── package.json
├── package-lock.json
└── README.md
```

## 📝 Schema Format

Create JSON files in the `schemas/` directory to define your API endpoints:

```json
{
  "endpoint": "/api/endpoint-path",
  "method": "GET",
  "context": "Description of what this endpoint does",
  "responseSchema": {
    "property1": "string",
    "property2": "number",
    "property3": { "enum": ["option1", "option2"] }
  }
}
```

### Example Schema (`schemas/customer_profile.json`)

```json
{
  "endpoint": "/customer/profile",
  "method": "GET",
  "context": "Return basic customer profile information for a telecom subscriber.",
  "responseSchema": {
    "customerId": "string",
    "name": "string",
    "plan": { "enum": ["Prepaid", "Postpaid"] },
    "balance": "number",
    "status": { "enum": ["Active", "Suspended", "Inactive"] }
  }
}
```

## 🔧 Usage

1. **Add Schema Files**: Place your JSON schema files in the `schemas/` directory
2. **Start Server**: Run `npm start`
3. **Access Endpoints**: The server will automatically create endpoints based on your schemas

### Example Request

```bash
curl http://localhost:3000/customer/profile
```

### Example Response

```json
{
  "customerId": "CUS_12345",
  "name": "John Doe",
  "plan": "Prepaid",
  "balance": 50,
  "status": "Active"
}
```

## 🎯 API Endpoints

The server automatically registers endpoints based on schema files:

- **GET** `/customer/profile` - Customer profile information
- *(Add more endpoints by creating schema files)*

## 🔧 Configuration

### Server Port

The server runs on port 3000 by default. You can change this in `server.js`:

```javascript
const PORT = 3000;  // Change to desired port
```

### Ollama Configuration

The generator connects to Ollama on `localhost:11434` by default. You can modify this in `generators/ollamaGenerator.js`:

```javascript
const response = await axios.post('http://localhost:11434/api/generate', {
  model: "llama3",  // Change model if needed
  // ...
});
```

## 🛡️ Error Handling

The server includes comprehensive error handling:

- **LLM Failures**: Automatic fallback to schema-based responses
- **JSON Parsing Errors**: Multiple parsing strategies with fallbacks
- **Network Issues**: Graceful error responses
- **Invalid Schemas**: Detailed error logging

## 📊 Logging

The server provides detailed logging for:

- API endpoint registration
- LLM response generation
- JSON parsing attempts
- Error conditions
- Raw LLM responses (for debugging)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**JMM** - Initial work and development

## 🙏 Acknowledgments

- [Ollama](https://ollama.com) for providing the LLM infrastructure
- [Express.js](https://expressjs.com/) for the web framework
- [Node.js](https://nodejs.org/) community for the ecosystem

## 📚 Additional Resources

- [Ollama Documentation](https://ollama.com/docs)
- [Express.js Documentation](https://expressjs.com/en/guide/routing.html)
- [JSON Schema Documentation](https://json-schema.org/)

---

**Made with ❤️ by JMM** 