/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from 'vscode';
import { waitUntil } from 'async-wait-until';
import { assert } from 'chai';

export async function checkNotExpectedCompletion(docUri: vscode.Uri, position: vscode.Position, expectedCompletion: vscode.CompletionItem) {
    let hasUnExpectedCompletion = true;
    await waitUntil(async () => {
        // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
        await (vscode.commands.executeCommand('vscode.executeCompletionItemProvider', docUri, position)).then(value => {
			const actualCompletionList = value as vscode.CompletionList;
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
	try {
		await waitUntil(async () => {
			// Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
			await (vscode.commands.executeCommand('vscode.executeCompletionItemProvider', docUri, position)).then(value => {
				const actualCompletionList = value as vscode.CompletionList;
				const completionItemFound = actualCompletionList.items.find(completion => {
					return completion.label === expectedCompletion.label;
				});
				hasExpectedCompletion = completionItemFound !== undefined;
			});
			return hasExpectedCompletion;
		}, 10000, 500);
	} catch {
		assert.fail(`Not found expect completion ${expectedCompletion.label}`);
	}
}
