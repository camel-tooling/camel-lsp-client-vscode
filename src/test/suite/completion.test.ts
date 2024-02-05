/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import * as vscode from 'vscode';
import * as chai from 'chai';
import { getDocUri, activate } from './helper';

const expect = chai.expect;

describe('Should do completion in Camel URi after "ti"', () => {
	const docUriXml = getDocUri('apacheCamel.xml');
	const docUriJava = getDocUri('apacheCamel.java');
	const docUriGroovy = getDocUri('helloworld.camelk.groovy');
	const docUriKotlin = getDocUri('helloworld.camelk.kts');
	const docUriJS = getDocUri('helloworld.js');
	const docUriYaml = getDocUri('helloworld.camelk.yaml');
	const expectedCompletion = [
		{ label: 'tika:operation'},
		{ label: 'timer:timerName'}
	];

	it('Completes components for XML', async () => {
		await testCompletion(docUriXml, new vscode.Position(0, 13), {
			items: expectedCompletion
		});
	});

	it('Completes components for Java', async () => {
		await testCompletion(docUriJava, new vscode.Position(6, 16), {
			items: expectedCompletion
		});
	});

	it('Completes components for Groovy', async () => {
		await testCompletion(docUriGroovy, new vscode.Position(0, 8), {
			items: expectedCompletion
		});
	});

	it('Completes components for Kotlin', async () => {
		await testCompletion(docUriKotlin, new vscode.Position(0, 8), {
			items: expectedCompletion
		});
	});

	it('Completes components for JS', async () => {
		await testCompletion(docUriJS, new vscode.Position(2, 8), {
			items: expectedCompletion
		});
	});

	it('Completes components for YAML', async () => {
		await testCompletion(docUriYaml, new vscode.Position(4, 16), {
			items: expectedCompletion
		});
	});

	it('Completes components for YAML using shortcut', async () => {
		await testCompletion(docUriYaml, new vscode.Position(12, 21), {
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
