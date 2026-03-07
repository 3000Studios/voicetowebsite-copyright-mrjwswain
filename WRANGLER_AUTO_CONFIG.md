# Wrangler-Based Auto-Run Everything Configuration

This document outlines the complete automation setup using Wrangler for deployment and local
automation.

## 🚀 Quick Start

```bash
# Install auto-run system
npm run auto:run:install

# Start everything manually
npm run auto:run

# Uninstall auto-run system
npm run auto:run:uninstall
```

## 📋 Automation Components

### 1. Auto-Run Everything Script (`scripts/auto-run-everything.mjs`)

**Features:**

- 🖥️ Automatic development servers (frontend + worker)
- 📁 File watching and auto-rebuilding
- 📦 Auto-commit and push on changes
- 🚀 Auto-deployment with Wrangler
- 🧪 Continuous testing and validation
- 📊 Performance monitoring

**Configuration:**

```javascript
// Edit scripts/auto-run-everything.mjs to customize:
this.config = {
  runDevFrontend: true, // Start Vite dev server
  runDevWorker: true, // Start Wrangler dev server
  autoCommit: true, // Auto-commit changes
  autoPush: true, // Auto-push to remote
  autoDeploy: true, // Auto-deploy with Wrangler
  autoTest: true, // Run tests automatically
  watchFiles: true, // Watch for file changes
  performanceMonitoring: true,
  debounceMs: 3000, // Debounce file changes
  minIntervalMs: 15000, // Minimum interval between operations
  deployDelayMs: 5000, // Delay between deployments
};
```

### 2. Windows Task Scheduler Integration

**Install:**

```powershell
npm run auto:run:install
```

**What it does:**

- Creates Windows Task Scheduler task
- Runs on system startup and user login
- Creates desktop shortcut
- Sets environment variables
- Starts auto-run system automatically

**Environment Variables:**

- `VTW_AUTO_RUN_ENABLED=1`
- `VTW_PROJECT_PATH=<project-path>`
- `VTW_AUTO_DEPLOY=1`
- `VTW_AUTO_COMMIT=1`

### 3. Git Hooks Automation

**Pre-commit Hook (`.husky/pre-commit`):**

- Ensures Node.js version 20
- Updates global system documentation
- Runs lint-staged
- Full verification pipeline

**Pre-push Hook (`.husky/pre-push`):**

- Runs pre-push validation
- Auto-deploys with Wrangler if `VTW_AUTO_DEPLOY_ON_PUSH=1`

### 4. Wrangler Deployment

**Primary Deployment Method:**

```bash
npx wrangler deploy
```

**Fallback Deployment:**

```bash
npm run deploy
```

**Auto-deployment Triggers:**

- File changes with successful validation
- Git push (if enabled)
- Manual trigger via workflow dispatch

## 🛠️ Configuration Options

### Environment Variables

```bash
# Enable/disable auto-run features
export VTW_AUTO_RUN_ENABLED=1
export VTW_AUTO_DEPLOY=1
export VTW_AUTO_COMMIT=1
export VTW_AUTO_PUSH=1
export VTW_AUTO_TEST=1

# Deployment settings
export VTW_AUTO_DEPLOY_ON_PUSH=1
export VTW_PROJECT_PATH="/path/to/project"

# Timing settings
export AUTO_SHIP_DEBOUNCE_MS=12000
export AUTO_SHIP_MIN_INTERVAL_MS=60000
export AUTO_SHIP_DEPLOY=1
```

### Package.json Scripts

```json
{
  "auto:run": "node ./scripts/auto-run-everything.mjs",
  "auto:run:install": "powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/install-auto-run-task.ps1",
  "auto:run:uninstall": "powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/uninstall-auto-run-task.ps1"
}
```

## 🔄 Workflow Automation

### Development Workflow

1. **Auto-start**: Development servers start automatically
2. **File watching**: Changes trigger validation and rebuild
3. **Auto-commit**: Valid changes are committed automatically
4. **Auto-push**: Commits are pushed to remote
5. **Auto-deploy**: Wrangler deploys on successful validation

### CI/CD Workflow (GitHub Actions - Basic)

1. **Validation**: Code quality and tests
2. **No deployment**: Uses Wrangler instead of GitHub Actions

### Local Deployment Workflow

1. **Pre-push validation**: Ensures code quality
2. **Wrangler deployment**: Direct to Cloudflare Workers
3. **Post-deployment validation**: Health checks

## 📊 Monitoring and Logging

### Performance Monitoring

- Memory usage tracking
- Process health monitoring
- Automatic restart of failed processes

### Logging Levels

- **Info**: Normal operations
- **Warn**: Non-critical issues
- **Error**: Critical failures

### Health Checks

- Development server status
- Worker dev server status
- Deployment success validation

## 🎯 Usage Scenarios

### 1. Full Automation (Recommended)

```bash
# Install once
npm run auto:run:install

# Everything runs automatically
# - Dev servers start on boot
# - Changes are auto-committed
# - Deployments happen automatically
```

### 2. Manual Control

```bash
# Start everything manually
npm run auto:run

# Or control individual components
npm run dev:all          # Start dev servers
npm run auto:ship        # Auto-commit and push
npx wrangler deploy     # Manual deployment
```

### 3. Development Only

```bash
# Set environment variables
export VTW_AUTO_DEPLOY=0
export VTW_AUTO_COMMIT=0

# Run with file watching only
npm run auto:run
```

## 🔧 Troubleshooting

### Common Issues

**1. Node.js Version Issues**

```bash
nvm use 20
```

**2. Wrangler Authentication**

```bash
npx wrangler auth login
```

**3. Permission Issues**

```bash
# Run PowerShell as Administrator for installation
npm run auto:run:install
```

**4. Process Conflicts**

```bash
# Stop existing processes
npm run auto:run:uninstall
# Restart
npm run auto:run:install
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=vtw:* npm run auto:run
```

### Reset Configuration

```bash
# Remove all auto-run configuration
npm run auto:run:uninstall

# Clean git hooks
rm .husky/pre-commit
rm .husky/pre-push

# Reinstall
npm run auto:run:install
```

## 📈 Performance Optimization

### Memory Management

- Automatic garbage collection
- Process memory monitoring
- Restart on memory leaks

### File Watching Optimization

- Debounced file changes
- Ignored directories (node_modules, dist, .git)
- Efficient file system watching

### Deployment Optimization

- Minimum deployment intervals
- Validation before deployment
- Rollback on failure

## 🔐 Security Considerations

### Git Automation

- Auto-commits use descriptive messages
- Sensitive files excluded from auto-commit
- Push requires proper authentication

### Wrangler Deployment

- Uses existing Wrangler authentication
- Respects wrangler.toml configuration
- No secrets in auto-run scripts

### Windows Task Scheduler

- Runs as SYSTEM user for reliability
- Limited to project directory
- No elevated privileges beyond necessary

## 📚 Advanced Configuration

### Custom File Watching Patterns

```javascript
// Edit auto-run-everything.mjs
shouldIgnore(fullPath) {
  const ignorePatterns = [
    ".git", "node_modules", "dist",
    ".wrangler", ".vite", "coverage",
    "*.log", ".DS_Store", "Thumbs.db"
  ];
  return ignorePatterns.some(pattern =>
    fullPath.includes(pattern)
  );
}
```

### Custom Deployment Commands

```javascript
// Edit auto-run-everything.mjs
async autoDeploy() {
  // Custom deployment logic
  await this.runCommand("npx", ["wrangler", "deploy", "--env", "production"]);
}
```

### Custom Validation Pipeline

```javascript
// Edit auto-run-everything.mjs
async runValidationPipeline() {
  await this.runCommand("npm", ["test"]);
  await this.runCommand("npm", ["run", "type-check"]);
  await this.runCommand("npm", ["run", "build"]);
  // Add custom validations
}
```

## 🎉 Best Practices

1. **Start Small**: Enable features gradually
2. **Monitor Logs**: Watch for errors and warnings
3. **Test Locally**: Validate before enabling auto-deploy
4. **Backup**: Keep manual deployment as fallback
5. **Document Changes**: Update configuration when modifying

## 📞 Support

For issues with the auto-run system:

1. Check logs in the console output
2. Verify environment variables
3. Ensure Wrangler authentication
4. Check Node.js version (20.x)
5. Review this documentation for configuration options
