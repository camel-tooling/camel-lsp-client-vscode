import * as vscode from 'vscode';

import { waitUntil } from 'async-wait-until';

export async function checkNotExpectedCompletion(docUri: vscode.Uri, position: vscode.Position, expectedCompletion: vscode.CompletionItem) {
    let hasUnExpectedCompletion = true;
    await waitUntil(() => {
        // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
        (vscode.commands.executeCommand('vscode.executeCompletionItemProvider', docUri, position)).then(value => {
			let actualCompletionList = value as vscode.CompletionList;
			const completionItemFound = actualCompletionList.items.find(completion => {
				return completion.label === expectedCompletion.label;
			});
            hasUnExpectedCompletion = completionItemFound !== undefined;
        });
        return !hasUnExpectedCompletion;
	}, 30000, 500);
}

export async function checkExpectedCompletion(docUri: vscode.Uri, position: vscode.Position, expectedCompletion: vscode.CompletionItem) {
    let hasExpectedCompletion = false;
    await waitUntil(() => {
        // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
        (vscode.commands.executeCommand('vscode.executeCompletionItemProvider', docUri, position)).then(value => {
			let actualCompletionList = value as vscode.CompletionList;
			const completionItemFound = actualCompletionList.items.find(completion => {
				return completion.label === expectedCompletion.label;
			});
            hasExpectedCompletion = completionItemFound !== undefined;
        });
        return hasExpectedCompletion;
    }, 10000, 500);
}
