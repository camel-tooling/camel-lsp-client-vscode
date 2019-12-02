'use strict';

import * as vscode from 'vscode';
import * as chai from 'chai';
import { getDocUri, activate } from './helper';

const expect = chai.expect;

describe('Should do completion in Camel URI using the additional component specified in preference', () => {
	const docUriXml = getDocUri('test-additional-component.xml');
	const expectedCompletion = [
		{ label: 'acomponent:withsyntax'}
	];

	afterEach(() => {
		let config = vscode.workspace.getConfiguration();
		config.update('camel.extra-components', undefined);
	});

	it('Updated additional component is reflected in completion', async () => {
		await checkNoAdditionalComponent(docUriXml);

		let config = vscode.workspace.getConfiguration();
		await config.update('camel.extra-components', [{
			'component' : {
				'kind': 'component',
				'scheme': 'acomponent',
				'syntax': 'acomponent:withsyntax'
			}
		}]);
		await testCompletion(docUriXml, new vscode.Position(0, 11), {
			items: expectedCompletion
		});

		await config.update('camel.extra-components', undefined);
		await checkNoAdditionalComponent(docUriXml);
	});

});

async function checkNoAdditionalComponent(docUriXml: vscode.Uri) {
	const actualCompletionList = await retrieveCompletionList(docUriXml, new vscode.Position(0, 11));
	const actualCompletionLabelList = actualCompletionList.items.map(c => { return c.label; });
	expect(actualCompletionLabelList).to.not.include('acomponent:withsyntax');
}

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
}
async function retrieveCompletionList(docUri: vscode.Uri, position: vscode.Position) {
	// Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
	return (await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', docUri, position)) as vscode.CompletionList;
}

