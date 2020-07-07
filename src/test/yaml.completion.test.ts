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
		await updateSettings("schemas", { "/home/apupier/git/camel-lsp-client-vscode/test Fixture with speci@l chars/camelk-yaml-schema.json" : "*.camelk.yaml"});
	});

	after( async () => {
		await resetSettings("schemas", {});
	});

	it('Completes root elements in Yaml', async () => {
		await testCompletion(docUriEmptyYaml, new vscode.Position(1, 2), {
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

export const updateSettings = (setting: any, value: any) => {
	const yamlConfiguration = vscode.workspace.getConfiguration("yaml");
    return yamlConfiguration.update(setting, value, false);
}

export const resetSettings = (setting: any, value: any) => {
	const yamlConfiguration = vscode.workspace.getConfiguration("yaml");
    return yamlConfiguration.update(setting, value, false);
}
