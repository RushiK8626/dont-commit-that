import * as vscode from 'vscode';
import { scanContent } from './scanner/';
import { SecretQuickFixProvider } from './quickFixes';
import updateDiagnostics, { setDiagnosticCollection } from './diagnostic';
import { removeSecret, moveSecretToEnv, ignoreOnce, ignoreAlways } from './commands/quickFixes';
import { installGitHook } from './commands/installHooks';

let updateTimeout: NodeJS.Timeout | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {

	const diagnosticCollection = vscode.languages.createDiagnosticCollection('dont-commit-that');
	setDiagnosticCollection(diagnosticCollection);
	context.subscriptions.push(diagnosticCollection);

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			{ scheme: 'file' },
			new SecretQuickFixProvider(),
			{
				providedCodeActionKinds: [
					vscode.CodeActionKind.QuickFix
				]
			}
		)
	);

	console.log('[dont-commit-that] Extension activated');


	const disposable = vscode.commands.registerCommand('dont-commit-that.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Don\'t Commit That!!');
	});

	// Detect on save
	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument((document) => {
			if(updateTimeout) { clearTimeout(updateTimeout); }
			handleDocumentUpdate(document, true);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(async (event) => {
			if(updateTimeout) { clearTimeout(updateTimeout); }
			updateTimeout = setTimeout(() => {
				handleDocumentUpdate(event.document, false);
			}, 500);
		})
	);

	// Register the quick fixes
	context.subscriptions.push(
		vscode.commands.registerCommand("dontCommitThat.removeSecretAndSave", removeSecret)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("dontCommitThat.moveToEnv", moveSecretToEnv)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("dontCommitThat.ignoreOnce", ignoreOnce)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("dontCommitThat.ignoreAlways", ignoreAlways)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("dontCommitThat.installGitHook", installGitHook)
	);

	context.subscriptions.push(disposable);
}


async function handleDocumentUpdate(document: vscode.TextDocument, showWarning: boolean = true) {
	// Skip non-file docs (settings, output, etc.)
	if (document.uri.scheme !== 'file') {
		return;
	}

	// Skip binary or very large files and env files
	if (document.getText().length > 500_000 || document.fileName.split('.').pop() === "env") {
		return;
	}

	const filePath = document.uri.fsPath;
	const content = document.getText();

	const findings = scanContent(content, filePath);
	updateDiagnostics(document, findings, showWarning);
}

export function deactivate() { }

