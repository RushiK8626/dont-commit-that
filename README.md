# <img src="icon.png" width="32" height="32" align="center"> dont-commit-that

A VS Code extension that prevents accidental commits of secrets, credentials, and sensitive information in your repository. Includes an integrated pre-commit hook for additional protection.

## Features

- **Real-time Secret Detection** — Scans your files as you edit and highlights potential secrets
- **Pre-commit Protection** — Automatically blocks commits containing sensitive data
- **Clear Diagnostics** — Provides precise file and line references for detected secrets
- **Customizable Patterns** — Easily extend detection rules for your specific needs
- **Visual Indicators** — See security warnings directly in the VS Code Problems panel

## Demo

[Placeholder for demo screenshot/GIF]

## Installation

1. Install the extension from the VS Code Marketplace (or via VSIX)
2. The pre-commit hook will be automatically configured when you open a Git repository
3. If not installed automatically, open the Command Palette.<br/> Windows: `Ctrl + Shift + P`<br/>MacOS: `Cmd + Shift + P`<br/>
    Search "Don't Commit That: Install Pre-Commit Hook" and install it
3. Start coding with automatic secret detection enabled

## How It Works

### In the Editor
- The extension continuously scans open files for patterns matching secrets
- Detected issues appear in the Problems panel with file and line references
- Hover over highlighted code to see detailed information about the detected secret

### During Commits
- When you attempt to commit, staged files are automatically scanned
- If secrets are detected, the commit is blocked with a detailed report in the terminal
- Review and fix the issues before committing again

## Getting Started for Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Extension

```bash
npm run compile
```

### 3. Install the Pre-commit Hook

Install the hook automatically:

```bash
npm run install-hook
```

Or manually integrate `hooks/precommit.ts` logic into your `.git/hooks/pre-commit` file.

### 4. Run the Extension

Press `F5` in VS Code to launch the Extension Development Host and test the extension.

## Extension Commands

Access these commands via the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- **Don't Commit That: Scan Current File** — Manually scan the active file for secrets
- **Don't Commit That: Scan Workspace** — Scan all files in the workspace
- **Don't Commit That: Configure Patterns** — Customize secret detection patterns

## Project Structure

```
├── src/
│   ├── extension.ts          # Extension entry point
│   ├── scanner/              # Pattern-based file scanning
│   │   └── pattern.ts        # Secret detection patterns
│   ├── ignore/               # Ignore rules and hash store
│   └── commands/             # VS Code extension commands
├── hooks/
│   └── precommit.ts          # Pre-commit hook logic
└── package.json              # Extension manifest
```

## Customization

### Adding Custom Patterns

Edit `src/scanner/pattern.ts` to add or modify detection patterns:

```typescript
// Example: Add a custom API key pattern
{
  name: 'Custom API Key',
  pattern: /custom_api_key_[a-zA-Z0-9]{32}/g,
  severity: 'high'
}
```

### Configuring Ignore Rules

Extend ignore logic in `src/ignore/` to exclude specific files, patterns, or hash values from detection.

## Bypassing Protection

### Bypassing the Pre-commit Hook

To bypass the pre-commit hook in emergencies (not recommended):

```bash
git commit --no-verify
```

### Ignoring Specific Findings

Use the extension's ignore functionality to whitelist false positives without disabling protection entirely.

## Configuration

Configure the extension through VS Code settings (`settings.json`):

```json
{
  "dontCommitThat.enableRealtimeScanning": true,
  "dontCommitThat.scanOnSave": true,
  "dontCommitThat.excludePatterns": ["**/node_modules/**", "**/dist/**"]
}
```

## Requirements

- VS Code 1.80.0 or higher
- Git repository (for pre-commit hook functionality)
- Node.js 16+ (for development)

## Contributing

Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs before submitting a PR.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Known Issues

- See the [GitHub Issues](https://github.com/your-repo/dont-commit-that/issues) page for current known issues

## Release Notes

### 0.1.0
- Initial release
- Real-time secret detection
- Pre-commit hook integration
- Basic pattern matching for common secrets

## License

MIT License