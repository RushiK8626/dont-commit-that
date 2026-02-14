import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function installGitHook() {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace) {
        vscode.window.showErrorMessage("No workspace folder found.");
        return;
    }

    const workspaceRoot = workspace.uri.fsPath;
    const gitDir = path.join(workspaceRoot, ".git");

    if (!fs.existsSync(gitDir)) {
        vscode.window.showErrorMessage("This workspace is not a Git repository.");
        return;
    }

    const hooksDir = path.join(gitDir, "hooks");
    const hookPath = path.join(hooksDir, "pre-commit");

    // Do not overwrite existing hook
    if (fs.existsSync(hookPath)) {
        vscode.window.showWarningMessage(
            "A pre-commit hook already exists. Please integrate Don't Commit That manually."
        );
        return;
    }

    // Copy the bundled precommit script to the workspace
    const dctDir = path.join(workspaceRoot, ".dont-commit-that");
    fs.mkdirSync(dctDir, { recursive: true });

    // The precommit.js is bundled alongside the extension
    const extensionDir = path.dirname(__dirname);
    const bundledPrecommit = path.join(extensionDir, "dist", "precommit.js");

    // Also check relative to current dist directory
    const altBundledPrecommit = path.join(__dirname, "precommit.js");
    const sourcePrecommit = fs.existsSync(bundledPrecommit) ? bundledPrecommit : altBundledPrecommit;

    if (!fs.existsSync(sourcePrecommit)) {
        vscode.window.showErrorMessage(
            "Could not find precommit.js bundle. Please reinstall the extension."
        );
        return;
    }

    const destPrecommit = path.join(dctDir, "precommit.js");
    fs.copyFileSync(sourcePrecommit, destPrecommit);

    // Add .dont-commit-that to .gitignore if not already there
    const gitignorePath = path.join(workspaceRoot, ".gitignore");
    const gitignoreEntry = ".dont-commit-that/";
    if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, "utf8");
        if (!content.includes(gitignoreEntry)) {
            fs.appendFileSync(gitignorePath, `\n${gitignoreEntry}\n`, "utf8");
        }
    } else {
        fs.writeFileSync(gitignorePath, `${gitignoreEntry}\n`, "utf8");
    }

    const hookContent = `#!/bin/sh
# Installed by Don't Commit That

node "$(git rev-parse --show-toplevel)/.dont-commit-that/precommit.js"
RESULT=$?

if [ $RESULT -ne 0 ]; then
  exit 1
fi

exit 0
`;

    try {
        fs.mkdirSync(hooksDir, { recursive: true });
        fs.writeFileSync(hookPath, hookContent, { encoding: "utf8" });

        // Best effort chmod (safe on Unix, ignored on Windows)
        try {
            fs.chmodSync(hookPath, 0o755);
        } catch {}

        vscode.window.showInformationMessage(
            "Git pre-commit hook installed by Don't Commit That."
        );
    } catch (err) {
        console.error(err);
        vscode.window.showErrorMessage("Failed to install Git hook.");
    }
}
