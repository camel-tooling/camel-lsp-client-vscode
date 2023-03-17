'use strict';

import * as vscode from 'vscode';
import * as chai from 'chai';
import { getDocUri, activate } from './helper';

const expect = chai.expect;

describe('Should do completion in modeline', () => {
	const docUriXml = getDocUri('ModelineCompletion.java');
	const expectedCompletion = [
		{ label: 'trait'},
		{ label: 'dependency'}
	];

	it('Completes modeline options', async () => {
		await testCompletion(docUriXml, new vscode.Position(0, 13), {
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
	const actualCompletionList = await vscode.commands.executeCommand(
		'vscode.executeCompletionItemProvider',
		docUri,
		position
	) as vscode.CompletionList;

	const expectedCompletionLabelList = expectedCompletionList.items.map(c => { return c.label; });
	const actualCompletionLabelList = actualCompletionList.items.map(c => { return c.label; });
	expect(actualCompletionLabelList).to.include.members(expectedCompletionLabelList);
}