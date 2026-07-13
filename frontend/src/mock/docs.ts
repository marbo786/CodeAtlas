export const MOCK_GENERATED_README = `
# CodeAtlas Analytics Service

This service handles the asynchronous processing of repository structural data, interacting with Qdrant for vector storage and PostgreSQL for relational metadata.

## Architecture

The service follows a standard three-tier architecture:
- **API Layer**: Defines the REST endpoints using FastAPI.
- **Service Layer**: Orchestrates business logic, calling both the vector DB and the SQL DB.
- **Data Access Layer**: Repositories abstracting the specific database implementations.

## Key Modules

### \`ingestion.py\`
Processes raw AST dumps from Tree-sitter, chunks them, and generates embeddings via the Gemini API before storing them.

### \`query_agent.py\`
The conversational core. Takes user queries, transforms them into vector search queries, retrieves relevant code blocks, and synthesizes a natural language response.

## Setup Instructions

1. Configure your \`.env\` file using \`.env.example\`.
2. Run \`docker-compose up -d\` to start PostgreSQL and Qdrant.
3. Start the service with \`uvicorn main:app --reload\`.

> **Note**: Ensure the Gemini API key is valid, otherwise ingestion will fail silently on embedding generation.
`;
