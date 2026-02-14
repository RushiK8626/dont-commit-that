import * as vscode from 'vscode';
import * as path from 'path';
import { Finding, Severity } from "./scanner";
import { loadIgnoreFile } from './ignore/ignoreStore';

// Map to store findings by "uri:line" key for quick fix access
export const findingsMap = new Map<string, Finding>();

let diagnosticCollection: vscode.DiagnosticCollection;
export function setDiagnosticCollection(
    collection: vscode.DiagnosticCollection
) {
    diagnosticCollection = collection;
}

export default function updateDiagnostics(
	document: vscode.TextDocument,
	findings: Finding[],
    showWarning: boolean
) {
    loadIgnoreFile();

    // Clear old findings for this document
    const docUri = document.uri.toString();
    for (const [key] of findingsMap) {
        if (key.startsWith(docUri + ':')) {
            findingsMap.delete(key);
        }
    }

	const diagnostics: vscode.Diagnostic[] = [];
	
	const severityCounts: Record<Severity, number> = {
		"CRITICAL": 0,
		"HIGH": 0,
		"MEDIUM": 0,
		"LOW": 0,
	};
	
	for (const finding of findings) {
		const lineIndex = finding.line - 1;
		if (lineIndex < 0 || lineIndex >= document.lineCount) {
			continue;
		}
		
		const line = document.lineAt(lineIndex);
		
		const range = new vscode.Range(
			line.range.start,
			line.range.end
		);

		const diagnostic = new vscode.Diagnostic(
			range,
			`🚨 Hard-coded ${finding.type} detected!
Severity: ${finding.severity}

This value should be moved to an environment variable (.env).
Committing secrets can lead to account compromise.`,
			vscode.DiagnosticSeverity.Error
		);

		diagnostic.source = "Don't Commit That";
		diagnostic.code = finding.type;
		
		diagnostics.push(diagnostic);
		
		const findingKey = `${document.uri.toString()}:${diagnostic.range.start.line + 1}`;
		findingsMap.set(findingKey, finding);
		
		severityCounts[finding.severity as Severity]++;
	}
	
	diagnosticCollection.set(document.uri, diagnostics);

    if(!showWarning) { return; }
	
	let warningMessage: string = `Don't Commit That: ${diagnostics.length} secret(s) detected in path ${path.basename(document.fileName)}\n`;
	if (severityCounts["CRITICAL"]) {
		warningMessage += `CRITICAL: ${severityCounts["CRITICAL"]}\n`;
	}
	if (severityCounts["HIGH"]) {
		warningMessage += `HIGH: ${severityCounts["HIGH"]}\n`;
	}
	if (severityCounts["MEDIUM"]) {
		warningMessage += `MEDIUM: ${severityCounts["MEDIUM"]}\n`;
	}
	if (severityCounts["LOW"]) {
		warningMessage += `LOW: ${severityCounts["LOW"]}\n`;
	}

	if (diagnostics.length > 0) {
		vscode.window.showWarningMessage(warningMessage);
	}
}