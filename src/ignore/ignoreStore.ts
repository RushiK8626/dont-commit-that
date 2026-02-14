import * as fs from 'fs';
import * as path from 'path';
import computeLineHash from './hash';

let vscode: typeof import('vscode') | undefined;
try {
    vscode = require('vscode');
} catch {
    // Running outside VS Code (e.g., pre-commit hook)
    vscode = undefined;
}

interface IgnoreEntry {
    file: string;
    lineHash: string;
}

interface IgnoreFile {
    ignored: IgnoreEntry[];
}

const ignoreFilePath = getIgnoreFilePath();
let ignoreData: IgnoreFile;

function getIgnoreFilePath(): string | null {
    if (!vscode) { return null; }

    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace) {
        vscode.window.showErrorMessage('No workspace folder found. Cannot determine ignore file path.');
        return null;
    }

    return path.join(workspace.uri.fsPath, ".vscode", "dont-commit-that.json");
}

export function loadIgnoreFile(): IgnoreFile {
    if (!ignoreFilePath || !fs.existsSync(ignoreFilePath)) {
        return { ignored: [] };
    }
    try {
        const raw = fs.readFileSync(ignoreFilePath, 'utf-8');
        ignoreData = JSON.parse(raw);
        return ignoreData;
    } catch (err) {
        if (vscode) {
            vscode.window.showErrorMessage('Failed to load or parse ignore file. Using empty ignore list.');
        }
        return { ignored: [] };
    }
}

export function hasIgnoreEntry(
    file: string,
    lineContent: string
): boolean {
    if (!ignoreFilePath) {
        return false;
    }

    const lineHash = computeLineHash(file, lineContent);

    // Load and cache the ignore data if not already loaded
    if (!ignoreData) {
        ignoreData = loadIgnoreFile();
    }

    return ignoreData.ignored.some(entry =>
        entry.file === file &&
        entry.lineHash === lineHash
    );
}

export function addIgnoreEntry(
    file: string,
    lineContent: string
): boolean {
    if (!ignoreFilePath) {
        if (vscode) {
            vscode.window.showErrorMessage('Ignore file path not found.');
        }
        return false;
    }

    const lineHash = computeLineHash(file, lineContent);

    // Load and cache the ignore data if not already loaded
    if (!ignoreData) {
        ignoreData = loadIgnoreFile();
    }

    if (hasIgnoreEntry(file, lineContent)) {
        return false;
    }

    ignoreData.ignored.push({ file, lineHash });

    fs.mkdirSync(path.dirname(ignoreFilePath), { recursive: true });
    fs.writeFileSync(
        ignoreFilePath,
        JSON.stringify(ignoreData, null, 2),
        'utf-8'
    );

    return true;
}