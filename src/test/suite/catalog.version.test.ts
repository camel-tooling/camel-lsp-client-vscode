'use strict';

import * as vscode from 'vscode';
import * as chai from 'chai';
import { getDocUri, activate } from './helper';
import { checkExpectedCompletion, checkNotExpectedCompletion } from './completion.util';
import { waitUntil } from 'async-wait-until';

const expect = chai.expect;

describe('Should do completion in Camel URI using the Camel Catalog version specified in preference', () => {
	const docUriXml = getDocUri('test-catalog-version.xml');
	const expectedCompletion = { label: 'jgroups-raft:clusterName'};

	afterEach(async () => {
		const config = vscode.workspace.getConfiguration();
		await config.update('camel.Camel catalog version', undefined);
		await waitUntil( async() =>  {
			console.log(`Catalog version in settings: ${await vscode.workspace.getConfiguration().get('camel.Camel catalog version')}`);
			return (await vscode.workspace.getConfiguration().get('camel.Camel catalog version')) === '';
		});
	});

	it('Updated Catalog version is reflected in completion', async () => {
		await activate(docUriXml);
		const config = vscode.workspace.getConfiguration();
		expect(config.get('camel.Camel catalog version')).to.not.be.equal('2.22.0');
		console.log("Will check there si the expected completion when version is left to default");
		await checkExpectedCompletion(docUriXml, new vscode.Position(0, 21), expectedCompletion);
		await config.update('camel.Camel catalog version', '2.22.0');

		await waitUntil( async() =>  {
			console.log(`Catalog version in settings: ${await vscode.workspace.getConfiguration().get('camel.Camel catalog version')}`);
			return (await vscode.workspace.getConfiguration().get('camel.Camel catalog version')) === '2.22.0';
		});
		console.log("Will check there is not the expected completion when version is set to 2.22.0");
		await checkNotExpectedCompletion(docUriXml, new vscode.Position(0, 21), expectedCompletion);

		await config.update('camel.Camel catalog version', undefined);
		await checkExpectedCompletion(docUriXml, new vscode.Position(0, 21), expectedCompletion);
	});

});
