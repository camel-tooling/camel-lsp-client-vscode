'use strict';

import * as vscode from 'vscode';
import * as chai from 'chai';
import { getDocUri, activate } from './helper';

const expect = chai.expect;

describe('Should do completion in Camel URi after "ti" },', () => {
	const yamlSchemaUri: vscode.Uri = getDocUri('camelk-yaml-schema.json');
	const docUriYaml: vscode.Uri = getDocUri('helloworld.camelk.yaml');
	const docUriEmptyYaml: vscode.Uri = getDocUri('empty.camelk.yaml');
	const docUriEmptyStepsYaml: vscode.Uri = getDocUri('empty.steps.camelk.yaml');

	const expectedEmptyYamlCompletion = [
		{ label: 'error-handler' },
		{ label: 'from' },
		{ label: 'on-exception' },
		{ label: 'rest' },
		{ label: 'route' }
	];

	const expectedEmptyStepsYamlCompletion = [
		{ label: 'aggregate' },
		{ label: 'bean' },
		{ label: 'choice' },
		{ label: 'circuit-breaker' },
		{ label: 'claim-check' },
		{ label: 'convert-body-to' },
		{ label: 'delay' },
		{ label: 'do-try' },
		{ label: 'dynamic-router' },
		{ label: 'enrich' },
		{ label: 'error-handler' },
		{ label: 'filter' },
		{ label: 'idempotent-consumer' },
		{ label: 'load-balance' },
		{ label: 'log' },
		{ label: 'loop' },
		{ label: 'marshal' },
		{ label: 'multicast' },
		{ label: 'on-exception' },
		{ label: 'pipeline' },
		{ label: 'poll-enrich' },
		{ label: 'process' },
		{ label: 'recipient-list' },
		{ label: 'remove-header' },
		{ label: 'remove-headers' },
		{ label: 'remove-properties' },
		{ label: 'remove-property' },
		{ label: 'resequence' },
		{ label: 'rollback' },
		{ label: 'routing-slip' },
		{ label: 'saga' },
		{ label: 'sample' },
		{ label: 'script' },
		{ label: 'service-call' },
		{ label: 'set-body' },
		{ label: 'set-exchange-pattern' },
		{ label: 'set-header' },
		{ label: 'set-property' },
		{ label: 'sort' },
		{ label: 'split' },
		{ label: 'step' },
		{ label: 'stop' },
		{ label: 'threads' },
		{ label: 'throttle' },
		{ label: 'throw-exception' },
		{ label: 'to' },
		{ label: 'to-d' },
		{ label: 'tod' },
		{ label: 'transacted' },
		{ label: 'transform' },
		{ label: 'unmarshal' },
		{ label: 'validate' },
		{ label: 'wire-tap' },
		{ label: 'wiretap' }
	];

	const expectedUriCompletion = [
		{ label: 'tika:operation'},
		{ label: 'timer:timerName'}
	];

	before( async () => {
		await updateSettings('schemas', { [yamlSchemaUri.toString()] : '*.camelk.yaml'});
	});

	after( async () => {
		await resetSettings('schemas', {});
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
		await testCompletion(docUriYaml, new vscode.Position(12, 17), {
			items: expectedUriCompletion
		});
	});

	it('Completes id parameter of a route', async () => {
		await testCompletion(docUriYaml, new vscode.Position(4, 5), {
			items: [ { label: 'id'} ]
		});
	});

	it('Completes uri parameter within a from', async () => {
		await testCompletion(docUriYaml, new vscode.Position(6, 9), {
			items: [ { label: 'uri'} ]
		});
	});

	it('Completes parameters within a from', async () => {
		await testCompletion(docUriYaml, new vscode.Position(7, 11), {
			items: [ { label: 'parameters'} ]
		});
	});

	it('Completes steps within a route', async () => {
		await testCompletion(docUriYaml, new vscode.Position(9, 5), {
			items: [ { label: 'steps'} ]
		});
	});

	it('Completes steps in route for Yaml', async () => {
		await testCompletion(docUriEmptyStepsYaml, new vscode.Position(8, 10), {
			items: expectedEmptyStepsYamlCompletion
		});
	});
});

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
	const yamlConfiguration = vscode.workspace.getConfiguration('yaml');
    return yamlConfiguration.update(setting, value, false);
}

export const resetSettings = (setting: any, value: any) => {
	const yamlConfiguration = vscode.workspace.getConfiguration('yaml');
    return yamlConfiguration.update(setting, value, false);
}
