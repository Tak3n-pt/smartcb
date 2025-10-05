# GitHub MCP Server Setup Instructions

## 🚀 Quick Setup for GitHub MCP Server

The GitHub MCP server is installed! Now you need to configure it in Claude Desktop app.

## Step 1: Get GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new
2. Give it a name: "Claude MCP"
3. Select scopes:
   - ✅ repo (Full control of private repositories)
   - ✅ read:org (Read org and team membership)
   - ✅ read:user (Read user profile data)
4. Click "Generate token"
5. **COPY THE TOKEN** (you won't see it again!)

## Step 2: Configure Claude Desktop

1. **Close Claude Desktop app completely**

2. Create/Edit this file:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

   Or on Mac:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

3. Add this configuration (replace YOUR_GITHUB_TOKEN):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN_HERE"
      }
    }
  }
}
```

## Step 3: Restart Claude Desktop

1. Start Claude Desktop again
2. You should see GitHub MCP commands available!

## Step 4: Create Repository via Claude

Once configured, I can use these commands:
- Create repository
- Push code
- Create issues
- Manage pull requests

## Alternative: Manual GitHub Upload

If MCP setup doesn't work, here's the manual way:

### Create Repository:
```bash
# Using GitHub CLI (if you have it)
gh repo create smartcb-app --public --source=. --remote=origin --push

# Or manually:
1. Go to: https://github.com/new
2. Create "smartcb-app" repository
3. Run these commands:

git remote add origin https://github.com/YOUR_USERNAME/smartcb-app.git
git push -u origin main
```

## Your Repository Link:
Once created, share this with your client:
```
https://github.com/YOUR_USERNAME/smartcb-app
```

---

**Note**: The GitHub MCP server requires Claude Desktop to be restarted after configuration!