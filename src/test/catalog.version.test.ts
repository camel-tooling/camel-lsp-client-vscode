'use strict';

import * as vscode from 'vscode';
import * as chai from 'chai';
import { getDocUri, activate } from './helper';

const expect = chai.expect;
const waitUntil = require('async-wait-until');

describe('Should do completion in Camel URI using the Camel Catalog version specified in preference', () => {
	const docUriXml = getDocUri('test-catalog-version.xml');
	const expectedCompletion = { label: 'jgroups-raft:clusterName'};

	afterEach(() => {
		let config = vscode.workspace.getConfiguration();
		config.update('camel.Camel catalog version', undefined);
	});

	it('Updated Catalog version is reflected in completion', async () => {
		await activate(docUriXml);
		let config = vscode.workspace.getConfiguration();
		expect(config.get('camel.Camel catalog version')).to.not.be.equal('2.22.0');
		await checkExpectedCompletion(docUriXml, new vscode.Position(0, 21), expectedCompletion);
		await config.update('camel.Camel catalog version', '2.22.0');

		await checkNotExpectedCompletion(docUriXml, new vscode.Position(0, 21), expectedCompletion);

		await config.update('camel.Camel catalog version', undefined);
		await checkExpectedCompletion(docUriXml, new vscode.Position(0, 21), expectedCompletion);
	}).timeout(90000+10000+10000).skip();

});

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
	}, 90000, 500);
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

