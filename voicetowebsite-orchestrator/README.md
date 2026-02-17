# VoiceToWebsite Local Orchestrator

This is a local Express server that enables remote execution of npm scripts on your development machine.

## Purpose

The orchestrator server allows the `/api/execute` endpoint (running on Cloudflare Workers) to trigger local development tasks like:

- `npm run verify` - Run tests and validation
- `npm run deploy` - Deploy to production
- `npm run auto:ship` - Automated commit and deploy workflow

## Setup

1. **Install dependencies:**

   ```bash
   cd voicetowebsite-orchestrator
   npm install
   ```

2. **Set environment variable:**

   Add to your `.env` file in the project root:

   ```bash
   ORCH_TOKEN=your-secure-random-token-here
   ```

   Generate a secure token:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Start the orchestrator:**

   ```bash
   npm start
   ```

   The server will run on `http://localhost:3333`

## Usage

The orchestrator accepts POST requests to `/execute` with:

**Headers:**

- `x-orch-token`: Your ORCH_TOKEN value

**Body:**

```json
{
  "intent": "deploy site",
  "action": "deploy"
}
```

**Supported actions:**

- `verify` - Runs `npm run verify`
- `deploy` - Runs `npm run deploy`
- `auto-ship` - Runs `npm run auto:ship`

## Security

⚠️ **Important Security Notes:**

- The orchestrator has **full access** to run commands in your repository
- Always use a strong, unique `ORCH_TOKEN`
- Only run the orchestrator on trusted networks
- Never commit your `ORCH_TOKEN` to version control
- The orchestrator should only be accessible from localhost by default

## Integration

This orchestrator works with:

- `/api/execute` endpoint in `functions/execute.js`
- `/api/orchestrator` endpoint in `functions/orchestrator.js`
- Voice command system for hands-free deployment

## Troubleshooting

**Port already in use:**

```bash
# Find process using port 3333
netstat -ano | findstr :3333
# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Authentication errors:**

- Verify `ORCH_TOKEN` is set in your `.env` file
- Ensure the token matches between client and server
- Check that the `.env` file is in the project root (not in the orchestrator folder)
