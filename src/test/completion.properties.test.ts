'use strict';

import * as vscode from 'vscode';
import * as chai from 'chai';
import { getDocUri, activate } from './helper';

const expect = chai.expect;

describe('Should do completion in Camel component after "ti"', () => {
	const docUriXml = getDocUri('application.properties');
	const expectedCompletion = [
		{ label: 'tika'},
		{ label: 'timer'}
	];

	it('Completes components for application.properties', async () => {
		await testCompletion(docUriXml, new vscode.Position(0, 18), {
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

	const expectedCompletionLabelList = expectedCompletionList.items.map(c => { return c.label; });
	const actualCompletionLabelList = actualCompletionList.items.map(c => { return c.label; });
	expect(actualCompletionLabelList).to.include.members(expectedCompletionLabelList);
	expect(actualCompletionLabelList).to.not.include('test:name');
}