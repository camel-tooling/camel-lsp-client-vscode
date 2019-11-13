'use strict';

import * as vscode from 'vscode';
import * as chai from 'chai';
import { getDocUri, activate } from './helper';

const expect = chai.expect;

describe('Should do completion in Camel URI using the Camel Catalog version specified in preference', () => {
	const docUriXml = getDocUri('test-catalog-version.xml');
	const expectedCompletion = [
		{ label: 'jgroups-raft:clusterName'}
	];

	afterEach(() => {
		let config = vscode.workspace.getConfiguration();
		config.update('camel.Camel catalog version', undefined);
	});

	it('Updated Catalog version is reflected in completion', async () => {
		await testCompletion(docUriXml, new vscode.Position(0, 21), {
			items: expectedCompletion
		});
		let config = vscode.workspace.getConfiguration();
		await config.update('camel.Camel catalog version', '2.22.0');
		const actualCompletionList = await retrieveCompletionList(docUriXml, new vscode.Position(0, 21));
		const actualCompletionLabelList = actualCompletionList.items.map(c => { return c.label; });
		expect(actualCompletionLabelList).to.not.include('jgroups-raft:clusterName');

		await config.update('camel.Camel catalog version', undefined);
		await testCompletion(docUriXml, new vscode.Position(0, 21), {
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

	const actualCompletionList = await retrieveCompletionList(docUri, position);

	const expectedCompletionLabelList = expectedCompletionList.items.map(c => { return c.label; });
	const actualCompletionLabelList = actualCompletionList.items.map(c => { return c.label; });
	expect(actualCompletionLabelList).to.include.members(expectedCompletionLabelList);
	expect(actualCompletionLabelList).to.not.include('test:name');
}
async function retrieveCompletionList(docUri: vscode.Uri, position: vscode.Position) {
	// Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
	return (await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', docUri, position)) as vscode.CompletionList;
}

