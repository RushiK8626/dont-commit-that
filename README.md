# dont-commit-that

A pre-commit hook and VS Code extension to prevent accidental commits of secrets, credentials, or sensitive information in your repository.

## Features
- Scans staged files for secrets and sensitive data before commit
- Blocks commits if secrets are detected
- Provides clear diagnostics and file/line references
- Easily extensible for custom patterns

## How It Works
- The pre-commit hook scans all staged files using pattern-based detection.
- If secrets are found, the commit is blocked and details are shown in the terminal.
- You can review, fix, or explicitly ignore findings before committing.

## Getting Started

### 1. Install Dependencies

```
npm install
```

### 2. Build the Project

```
npm run compile
```

### 3. Install the Pre-commit Hook

You can install the pre-commit hook using the provided command:

```
npm run install-hook
```

Or manually copy `hooks/precommit.ts` logic into your `.git/hooks/pre-commit` file (compiled to JS).

### 4. Make a Commit

When you attempt to commit, staged files will be scanned. If secrets are detected, the commit will be blocked with a detailed report.

## Project Structure

- `hooks/precommit.ts` — Pre-commit hook logic
- `src/` — Core extension and scanning logic
- `src/scanner/` — Pattern-based file scanning
- `src/ignore/` — Ignore rules and hash store
- `src/commands/` — VS Code extension commands

## Customization
- Add or modify patterns in `src/scanner/pattern.ts` to detect new types of secrets.
- Extend ignore logic in `src/ignore/` as needed.

## Bypassing the Hook

To bypass the pre-commit hook (not recommended):

```
git commit --no-verify
```

## Contributing
Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs.

## License
MIT License
