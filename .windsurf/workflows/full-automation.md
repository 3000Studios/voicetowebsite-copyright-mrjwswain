---
name: full-automation
description: Complete automation workflow with full access and no prompts
parameters:
  auto_approve: true
  skip_confirmation: true
  full_access: true
  silent_mode: true
---

# Full Automation Workflow

This workflow enables automation for Windsurf while still respecting repo ship gates and deployment
policy.

## 🔧 Configuration

### Terminal Commands

- **Auto-execute all commands**: Enabled
- **Skip all confirmations**: Yes
- **Full system access**: Granted
- **Silent execution**: Enabled

### File Operations

- **Auto-create/delete/modify**: Enabled
- **System files access**: Granted
- **Hidden files access**: Granted
- **Read-only files override**: Enabled

### Git Operations

- **Auto-commit/push**: Enabled after verify passes
- **Auto-merge conflicts**: Disabled
- **Force push / history rewrite**: Disabled
- **Branch management**: `main` only unless explicitly requested

### Deployment

- **Auto-deploy**: Enabled
- **Force deploy**: Disabled
- **Auto-rollback**: Manual
- **Production access**: Granted

## 🚀 Execution Flow

### 1. Command Recognition

```bash
# Any terminal command is auto-executed
npm run dev:all          # Auto-started
npm run build           # Auto-executed
npm run deploy:live     # Auto-deployed after verify
git add .               # Auto-executed
git commit -m "msg"     # Auto-executed
npx wrangler deploy     # Auto-executed
```

### 2. File Operations

```javascript
// Any file operation is auto-applied
// No confirmation needed
// Full read/write access
// System files accessible
```

### 3. System Operations

```powershell
# System commands auto-executed
# Registry modifications allowed
# Service management enabled
# Process management enabled
```

## 📋 Automation Rules

### Always Auto-Execute

- All npm commands
- All git commands
- All wrangler commands
- All system commands
- All PowerShell commands
- All file operations
- Deployment commands that follow verify -> ship -> push -> deploy:live

### Never Prompt

- File creation/deletion
- Code modifications
- System changes
- Deployment operations after verify succeeds
- Configuration changes
- Security changes

### Full Access Granted

- File system (all locations)
- Registry access
- System configuration
- Network access
- Process management
- Service management
- No force-push or history rewrite

## 🎯 Usage Examples

### Development

```bash
# Auto-executed without prompts
npm run dev:all
npm run build
npm run test
npm run deploy:live
```

### Git Operations

```bash
# Auto-executed without confirmation
git add .
git commit -m "auto commit"
git push origin main
```

### System Operations

```powershell
# Auto-executed with elevated privileges
Set-ExecutionPolicy -ExecutionPolicy Unrestricted
New-Item -ItemType File -Path "system-file.txt"
Restart-Service -Name "service-name"
```

### File Operations

```javascript
// Auto-applied without confirmation
// Can modify any file
// Can create system files
// Can delete protected files
```

## 🔐 Security Considerations

### Full Access Mode

- **Verify gate enforced**: Yes
- **Force-push blocked**: Yes
- **Main branch protected by workflow rules**: Yes
- **Registry/system access**: Only when explicitly required

### Automation Level

- **Maximum automation**: Enabled
- **No human interaction**: Required
- **Silent operation**: Yes
- **Background execution**: Yes

## ⚡ Performance

### Immediate Execution

- **No waiting for confirmation**: 0ms delay
- **Instant command execution**: Immediate
- **Parallel operations**: Enabled
- **Background processing**: Yes

### Resource Usage

- **Full system resources**: Available
- **No throttling**: Disabled
- **Maximum concurrency**: Enabled
- **Priority execution**: High

## 🎮 Control

### Manual Override (if needed)

```bash
# Disable automation temporarily
export WINDSURF_AUTO_MODE=false

# Re-enable automation
export WINDSURF_AUTO_MODE=true
```

### Emergency Stop

```bash
# Stop all automation
taskkill /f /im windsurf.exe

# Or use workflow stop
/workflow stop full-automation
```

## 📊 Monitoring

### Silent Mode

- **No notifications**: Suppressed
- **No dialogs**: Hidden
- **No warnings**: Muted
- **No errors**: Logged only

### Background Operation

- **No UI interruption**: Yes
- **No focus stealing**: No
- **No popups**: Disabled
- **No sounds**: Muted

## 🎉 Benefits

### Maximum Productivity

- **Zero waiting time**: Instant execution
- **No interruptions**: Silent operation
- **Full automation**: Hands-free
- **Complete access**: No restrictions

### Developer Experience

- **Focus on code**: No distractions
- **Instant feedback**: Immediate results
- **Seamless workflow**: No breaks
- **Power tools**: Full system access

## 🔧 Customization

### Modify Automation Level

```json
{
  "automation": {
    "level": "maximum",
    "noRestrictions": false,
    "noPrompts": true,
    "silentMode": true
  }
}
```

### Adjust Permissions

```json
{
  "permissions": {
    "fullSystemAccess": true,
    "bypassAllRestrictions": false,
    "allowSystemModification": true
  }
}
```

## 🚀 Status

**Current Status**: ✅ FULLY AUTOMATED **Access Level**: 🔓 MAXIMUM **Prompt Mode**: ❌ DISABLED
**Silent Mode**: ✅ ENABLED **System Access**: 🔓 FULL

---

_This workflow provides high automation while keeping verify, ship, push, and deploy safeguards
intact._
