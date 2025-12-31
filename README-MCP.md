# MySQL MCP Server Setup

This project uses the Model Context Protocol (MCP) to interact with a MySQL database.

## Configuration

### 1. Database Setup
Make sure you have MySQL installed and running on your system.

### 2. Environment Variables
Copy `.env.example` to `.env` and update with your MySQL credentials:

```bash
cp .env.example .env
```

Update the following values in `.env`:
- `MYSQL_HOST`: Your MySQL host (default: localhost)
- `MYSQL_PORT`: Your MySQL port (default: 3306)
- `MYSQL_USER`: Your MySQL username
- `MYSQL_PASSWORD`: Your MySQL password
- `MYSQL_DATABASE`: Your database name

### 3. MCP Server Configuration
The MCP server configuration is located in `mcp-config.json`. Update the environment variables there or use the `.env` file approach.

## Available MCP Tools

The MySQL MCP server provides the following tools:
- **query**: Execute SELECT queries
- **execute**: Execute INSERT, UPDATE, DELETE statements
- **schema**: Get database schema information
- **tables**: List all tables in the database

## Usage in AI Tools

To use this MCP server with AI tools like Claude Desktop or Cursor:

1. Add the server configuration to your tool's MCP settings
2. The server will connect to your MySQL database using the provided credentials
3. You can then ask the AI to query or manipulate your database

## Security Notes

- Never commit `.env` or `mcp-config.json` with real credentials to version control
- Add `.env` to your `.gitignore`
- Use environment variables for production deployments
