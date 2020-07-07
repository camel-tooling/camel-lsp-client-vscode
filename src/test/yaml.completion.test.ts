'use strict';

import * as vscode from 'vscode';
import * as chai from 'chai';
import { getDocUri, activate } from './helper';

const expect = chai.expect;

describe('Should do completion in Camel URi after "ti"', () => {
	const yamlSchemaUri: vscode.Uri = getDocUri('camelk-yaml-schema.json');
	const docUriYaml: vscode.Uri = getDocUri('helloworld.camelk.yaml');
	const docUriEmptyYaml: vscode.Uri = getDocUri('empty.camelk.yaml');

	const expectedEmptyYamlCompletion = [
		{ label: 'error-handler' },
		{ label: 'from' },
		{ label: 'on-exception' },
		{ label: 'rest' },
		{ label: 'route' }

	];
	const expectedUriCompletion = [
		{ label: 'tika:operation'},
		{ label: 'timer:timerName'}
	];

	before( async () => {
		await initializeYAMLSchemaPreference(yamlSchemaUri);
	});

	after( async () => {
		await removeYAMLSchemaPreference();
	});

	it('Completes root elements in Yaml', async () => {
		await testCompletion(docUriEmptyYaml, new vscode.Position(2, 3), {
			items: expectedEmptyYamlCompletion
		});
	});

	it('Completes components in uri for Yaml', async () => {
		await testCompletion(docUriYaml, new vscode.Position(4, 16), {
			items: expectedUriCompletion
		});
	});

	it('Completes components in uri for Yaml using shortcut', async () => {
		await testCompletion(docUriYaml, new vscode.Position(12, 21), {
			items: expectedUriCompletion
		});
	});
});

interface JSONSchemaSettings {
    fileMatch?: string[];
    url?: string;
    schema?: object;
}

async function initializeYAMLSchemaPreference(yamlSchemaUri: vscode.Uri) {
	const config = vscode.workspace.getConfiguration();
	let schemas: JSONSchemaSettings = config.get('yaml.schemas');
	if (schemas === undefined) {
		schemas = {};
	}
	schemas.fileMatch = ['*.camelk.yaml'];
	schemas.url = yamlSchemaUri.fsPath;
	await config.update('yaml.schemas', schemas);
}

async function removeYAMLSchemaPreference() {
	const config = vscode.workspace.getConfiguration();
	await config.update('yaml.schemas', undefined);
}

async function testCompletion(docUri: vscode.Uri, position: vscode.Position, expectedCompletionList: vscode.CompletionList) {
	await activate(docUri);

	// Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
	const actualCompletionList: vscode.CompletionList = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', docUri, position);
	const expectedCompletionLabelList = expectedCompletionList.items.map(c => { return c.label; });
	const actualCompletionLabelList = actualCompletionList.items.map(c => { return c.label; });
	expect(actualCompletionLabelList).to.include.members(expectedCompletionLabelList);
	expect(actualCompletionLabelList).to.not.include('test:name');
}
