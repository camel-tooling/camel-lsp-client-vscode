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
'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { waitUntil } from 'async-wait-until';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

/**
 * Activates the vscode-apache-camel extension
 */
export async function activate(docUri: vscode.Uri) {
	// The extensionId is `publisher.name` from package.json
	const ext = vscode.extensions.getExtension('redhat.vscode-apache-camel');
	await ext?.activate();
	try {
		doc = await vscode.workspace.openTextDocument(docUri);
		editor = await vscode.window.showTextDocument(doc);
		await sleep(2000); // Wait for server activation
	} catch (e) {
		console.error(e);
	}
}

async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export const getDocPath = (p: string) => {
	return path.resolve(__dirname, '../../../../test Fixture with speci@l chars', p);
};
export const getDocUri = (p: string) => {
	return vscode.Uri.file(getDocPath(p));
};

export async function setTestContent(content: string): Promise<boolean> {
	const all = new vscode.Range(
		doc.positionAt(0),
		doc.positionAt(doc.getText().length)
	);
	return editor.edit(eb => eb.replace(all, content));
}

export async function waitUntilEditorIsOpened(expectedFileNameWithExtension: string, timeout = 5_000): Promise<boolean> {
	return await waitUntil(function () {
		return vscode.window.activeTextEditor?.document.fileName.endsWith(expectedFileNameWithExtension);
	}, timeout) ?? false;
}

export async function waitUntilFileIsCreated(expectedFileNameWithExtension: string, timeout = 30_000): Promise<vscode.Uri> {
	let createdFile: vscode.Uri | undefined;
	await waitUntil(async function () {
		const files = await vscode.workspace.findFiles(expectedFileNameWithExtension);
		if (files.length === 1) {
			createdFile = files[0];
			return true;
		}
		console.log(`Waiting for file '${expectedFileNameWithExtension}' to be created...`);
		return false;
	}, timeout).catch(function () {
		throw new Error(`File with expected name '${expectedFileNameWithExtension}' not found in the workspace when calling command to create a new Camel route using JBang.`);
	});

	if (createdFile === undefined) {
        throw new Error(`File '${expectedFileNameWithExtension}' was not created within the specified timeout.`);
    }

	return createdFile;
}

export async function cleanCreatedFileAfterEachCommandExec(file: vscode.Uri): Promise<void> {
	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	await vscode.commands.executeCommand('workbench.action.terminal.clear');
	if (file && fs.existsSync(file.fsPath)) {
		fs.unlinkSync(file.fsPath);
	}
}
