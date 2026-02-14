import * as vscode from 'vscode';
import { findingsMap } from './diagnostic';

export class SecretQuickFixProvider implements vscode.CodeActionProvider {

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] {

        return context.diagnostics
            .filter(diagnostic => diagnostic.source === "Don't Commit That")
            .flatMap(diagnostic => this.createActions(document, diagnostic));
    }

    private createActions(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ): vscode.CodeAction[] {
        return [
            this.createRemoveSecretAction(document, diagnostic),
            this.createMovetoEnvAction(document, diagnostic),
            this.createIgnoreOnceAction(document, diagnostic),
            this.createIgnoreAlwaysAction(document, diagnostic)
        ];
    }

    private createRemoveSecretAction(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            "🧹 Remove the secret",
            vscode.CodeActionKind.QuickFix
        );

        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        action.command = {
            title: "Remove secret",
            command: "dontCommitThat.removeSecretAndSave",
            arguments: [document, diagnostic.range]
        };

        return action;
    }

    private createMovetoEnvAction(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            "🔐 Move secret to .env",
            vscode.CodeActionKind.QuickFix
        );

        action.diagnostics = [diagnostic];

        const findingKey = `${document.uri.toString()}:${diagnostic.range.start.line + 1}`;
        const finding = findingsMap.get(findingKey);

        let key = finding ? finding.key : undefined;
        let value = finding ? finding.value : undefined;

        action.command = {
            title: "Move secret to env",
            command: "dontCommitThat.moveToEnv",
            arguments: [document, key, value]
        };

        return action;
    }

    private createIgnoreOnceAction(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ) {
        const action = new vscode.CodeAction(
            "🔇 Ignore it once",
            vscode.CodeActionKind.QuickFix
        );

        action.diagnostics = [diagnostic];

        // Log and show warning if finding is missing
        const findingKey = `${document.uri.toString()}:${diagnostic.range.start.line + 1}`;
        if (!findingsMap.has(findingKey)) {
            vscode.window.showWarningMessage('No finding found for ignore-once action.');
        }

        action.command = {
            title: "Ignore it once",
            command: "dontCommitThat.ignoreOnce",
            arguments: [document, diagnostic.range.start.line]
        };

        return action;
    }

    private createIgnoreAlwaysAction(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ) {
        const action = new vscode.CodeAction(
            "⚠️ Ignore it always",
            vscode.CodeActionKind.QuickFix
        );

        action.diagnostics = [diagnostic];

        const findingKey = `${document.uri.toString()}:${diagnostic.range.start.line + 1}`;
        const finding = findingsMap.get(findingKey);

        action.command = {
            title: "Ignore it always",
            command: "dontCommitThat.ignoreAlways",
            arguments: [document, diagnostic, finding]
        };

        return action;
    }
}
