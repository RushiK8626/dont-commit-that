import * as vscode from 'vscode';
import * as path from 'path';
import { Finding } from '../scanner/';
import { addIgnoreEntry } from '../ignore/ignoreStore';

export async function removeSecret(
    document: vscode.TextDocument, 
    range: vscode.Range
) {
    const edit = new vscode.WorkspaceEdit();
    edit.delete(document.uri, range);
    const success = await vscode.workspace.applyEdit(edit);
    if (!success) {
        vscode.window.showErrorMessage('Failed to remove secret from document.');
    }
    await document.save();
}

export async function moveSecretToEnv(
	document: vscode.TextDocument,
	diagnostic: vscode.Diagnostic,
	key: string,
	value: string
) {
	const envEntry = `${key}=${value}\n`;
	
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		vscode.window.showErrorMessage("No workspace folder found");
		return;
	}
	
	const envPath = vscode.Uri.joinPath(workspaceFolders[0].uri, ".env");

	let envContent = "";

	try {
		envContent = (await vscode.workspace.fs.readFile(envPath)).toString();
	}
	catch {
		// env file doesn't exists. will create new one.
	}

	const keyRegex = new RegExp(`^${key}\\s*=`, 'm');
	if (!keyRegex.test(envContent)) {
		envContent += `${envEntry}`;
		await vscode.workspace.fs.writeFile(envPath, Buffer.from(envContent));
		vscode.window.showInformationMessage(`Secret moved to .env as ${key}`);
	} else {
		vscode.window.showWarningMessage(`.env already contains ${key}`);
	}

	const edit = new vscode.WorkspaceEdit();
	const secretLine = diagnostic.range.start.line;
	edit.delete(document.uri, document.lineAt(secretLine).rangeIncludingLineBreak);

	// Detect file extension using path.extname
	const fileExt = path.extname(document.uri.fsPath).toLowerCase();
	const fullText = document.getText();

	// Language-specific configurations
	const langConfig: Record<string, { imports: string[]; alias: string; envAccess: string }> = {
		'.js': { imports: [`require('dotenv').config();`], alias: 'const', envAccess: 'process.env' },
		'.jsx': { imports: [`require('dotenv').config();`], alias: 'const', envAccess: 'process.env' },
		'.ts': { imports: [`import 'dotenv/config';`], alias: 'const', envAccess: 'process.env' },
		'.tsx': { imports: [`import 'dotenv/config';`], alias: 'const', envAccess: 'process.env' },
		'.mjs': { imports: [`import 'dotenv/config';`], alias: 'const', envAccess: 'process.env' },
		'.cjs': { imports: [`require('dotenv').config();`], alias: 'const', envAccess: 'process.env' },
		'.py': { imports: [`import os`, `from dotenv import load_dotenv`, `load_dotenv()`], alias: '', envAccess: 'os.environ.get' },
		'.rb': { imports: [`require 'dotenv/load'`], alias: '', envAccess: 'ENV' },
		'.go': { imports: [], alias: '', envAccess: 'os.Getenv' },
	};

	const config = langConfig[fileExt];

	if (config) {
		// Insert missing imports at the top of the file
		for (const imp of config.imports) {
			if (!fullText.includes(imp)) {
				edit.insert(document.uri, new vscode.Position(0, 0), imp + '\n');
			}
		}

		// Build alias line based on language
		let aliasLine = '';
		switch (fileExt) {
			case '.js': case '.jsx': case '.cjs':
			case '.ts': case '.tsx': case '.mjs':
				aliasLine = `${config.alias} ${key} = ${config.envAccess}.${key};`;
				break;
			case '.py':
				aliasLine = `${key} = ${config.envAccess}("${key}")`;
				break;
			case '.rb':
				aliasLine = `${key} = ${config.envAccess}["${key}"]`;
				break;
			case '.go':
				aliasLine = `${key} := ${config.envAccess}("${key}")`;
				break;
		}

		if (aliasLine) {
			const originalLine = document.lineAt(secretLine).text;
			const indent = originalLine.match(/^\s*/)?.[0] ?? '';
			edit.insert(document.uri, new vscode.Position(secretLine, 0), indent + aliasLine + '\n');
		}
	}

	const success = await vscode.workspace.applyEdit(edit);
	if (!success) {
		vscode.window.showErrorMessage('Failed to update document after moving secret to .env.');
	}
	await document.save();
}

export async function ignoreOnce(
	document: vscode.TextDocument,
	lineNumber: number,
) {
	const edit = new vscode.WorkspaceEdit();

	// Determine comment style based on file extension
	const fileExt = path.extname(document.uri.fsPath).toLowerCase();
	let ignoreComment = '';
	switch (fileExt) {
		case '.js':
		case '.ts':
		case '.mjs':
		case '.cjs':
		case '.go':
			ignoreComment = '// dont-commit-that: ignore-once';
			break;
		case '.py':
		case '.rb':
			ignoreComment = '# dont-commit-that: ignore-once';
			break;
		default:
			ignoreComment = '// dont-commit-that: ignore-once';
	}

	edit.insert(document.uri, new vscode.Position(lineNumber, 0), ignoreComment + '\n');
	const success = await vscode.workspace.applyEdit(edit);
	if (!success) {
		vscode.window.showErrorMessage('Failed to add ignore-once comment.');
	}
	await document.save();
}

export async function ignoreAlways(
	document: vscode.TextDocument,
	finding: Finding
) {
	if(!finding) {
		vscode.window.showErrorMessage('No finding found for ignore always action.');
		return;
	}
	const lineContent = finding.key + "=" + finding.value;

	if(!addIgnoreEntry(finding.file, lineContent)) {
		vscode.window.showErrorMessage('Secret already there in the ingore list.');
	}
	await document.save();
}