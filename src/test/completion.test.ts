'use strict';

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

describe('Should do completion in Camel URi after "ti"', () => {
	const docUriXml = getDocUri('apacheCamel.xml');
	const docUriJava = getDocUri('apacheCamel.java');
	const expectedCompletion = [
		{ label: 'tika:operation'},
		{ label: 'timer:timerName'}
	];

	it('Completes components for XML', async () => {
		await testCompletion(docUriXml, new vscode.Position(0, 11), {
			items: expectedCompletion
		});
	});

	it('Completes components for Java', async () => {
		await testCompletion(docUriJava, new vscode.Position(6, 16), {
			items: expectedCompletion
		});
	});
});

async function testCompletion(
	docUri: vscode.Uri,
	position: vscode.Position,
	expectedCompletionList: vscode.CompletionList
) {
	await activate(docUri);

	// Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
	const actualCompletionList = (await vscode.commands.executeCommand(
		'vscode.executeCompletionItemProvider',
		docUri,
		position
	)) as vscode.CompletionList;

	assert.equal(actualCompletionList.items.length, expectedCompletionList.items.length);
	expectedCompletionList.items.forEach((expectedItem, i) => {
		const actualItem = actualCompletionList.items[i];
		assert.equal(actualItem.label, expectedItem.label);
	});
}