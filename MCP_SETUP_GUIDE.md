# MCP Setup Guide for Supabase Database Management in Trae AI

This guide will help you set up Model Context Protocol (MCP) to enable direct database management through **Trae AI** and Supabase.

## Prerequisites

1. **Supabase Project**: You need an active Supabase project
2. **Supabase Personal Access Token**: Required for authentication
3. **Node.js**: Version 18 or higher
4. **Trae AI**: The IDE you're currently using

## Step 1: Get Your Supabase Personal Access Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your profile icon (top right)
3. Go to "Access Tokens"
4. Click "Generate new token"
5. Give it a name (e.g., "MCP Database Access")
6. Copy the token (starts with `sbp_`)

## Step 2: Configure MCP in Trae AI

### Method 1: Through Trae AI Interface (Recommended)

1. **Open AI Management**: Press `Ctrl+U` to open the Agents panel in Trae AI
2. **Access MCP Settings**: Click the gear icon (AI Management) ➜ MCP ➜ Configure Manually
3. **Add Configuration**: Paste the following configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=tzhhxeyisppkzyjacodu"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

4. **Replace Token**: Replace `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your actual token from Step 1
5. **Confirm**: Click "Confirm" to save the configuration
6. **Restart**: Restart the Trae AI application

### Method 2: Using Project Configuration File

You can also use the `.mcp-config.json` file in your project as a reference, but the primary configuration should be done through Trae AI's interface.

## Step 3: Verify Installation

The Supabase MCP server will be automatically installed when first used. If you encounter issues, you can manually install it:

```bash
npm install -g @supabase/mcp-server-supabase@latest
```

## Step 4: Test the Connection

After restarting Trae AI, you should be able to:

1. **Select the MCP Server**: Choose "supabase" from the available MCP servers in Trae AI
2. **Test Queries**: Try these example queries:
   - "Show me all tables in my database"
   - "What's the structure of the trades table?"
   - "How many users are in the app_users table?"
   - "Show me the latest 5 trades"

## Your Database Structure

Your Supabase database contains **31 tables** including:
- **Core Trading**: `trades`, `accounts`, `trade_metrics`
- **User Management**: `app_users`, `user_settings`, `user_subscriptions_new`
- **Content**: `journal`, `notes`, `strategies`
- **Community**: `trader_profiles`, `community_follows`, `trade_likes`
- **Business**: `payments`, `subscription_plans`, `coupons`

## Security Notes

- **Personal Access Token**: Keep your token secure and never commit it to version control
- **Read-Only Mode**: The configuration uses `--read-only` flag for safety
- **Environment Variables**: Tokens are stored securely in Trae AI's configuration

## Troubleshooting

### Connection Issues
1. Verify your Personal Access Token is correct
2. Check that the project reference (`tzhhxeyisppkzyjacodu`) matches your project
3. Restart Trae AI completely

### MCP Server Not Available
1. Check that Node.js is installed (version 18+)
2. Verify internet connection for package installation
3. Try manually installing: `npm install -g @supabase/mcp-server-supabase@latest`

### Permission Errors
1. Ensure your Personal Access Token has the necessary permissions
2. Check your Supabase project's RLS (Row Level Security) policies

## Project Details

- **Project Reference**: `tzhhxeyisppkzyjacodu`
- **Database**: PostgreSQL (via Supabase)
- **Tables**: 31 tables for comprehensive trading journal functionality
- **Mode**: Read-only for safety

## Next Steps

Once connected in Trae AI, you can:
1. Query your database directly through natural language
2. Analyze trading data and patterns
3. Generate reports and insights
4. Explore relationships between tables
5. Use AI-powered database analysis within your IDE

The MCP integration allows you to seamlessly work with your database while coding, making data analysis and debugging much more efficient.