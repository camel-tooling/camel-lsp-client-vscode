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

import {
	VSBrowser,
	TextEditor,
	ContentAssist,
	WaitUntil,
	DefaultWait,
	EditorView
} from 'vscode-uitests-tooling';
import { assert } from 'chai';
import * as path from 'path';
import * as utils from '../utils/testUtils';
import * as ca from '../utils/contentAssist';

describe('YAML DSL support', function () {
	this.timeout(300000);

	const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');
	const CAMEL_CONTEXT_YAML = 'camel-context.yaml';
	const URI_POSITION = 14;

	let contentAssist: ContentAssist;
	let editor: TextEditor;

	before(async function () {
		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();
	});

	const _setup = function (camel_yaml: string) {
		return async function () {
			this.timeout(20000);
			await VSBrowser.instance.openResources(path.join(RESOURCES, camel_yaml));
			const ew = new EditorView();
			await ew.getDriver().wait(async function () {
				return (await ew.getOpenEditorTitles()).find(t => t === camel_yaml);
			}, 10000);
			editor = await utils.activateEditor(camel_yaml);
		}
	};

	const _clean = function (camel_yaml: string) {
		return async function () {
			this.timeout(15000);
			await utils.closeEditor(camel_yaml, false);
		}
	};

	describe('Camel URI code completion', function () {

		before(_setup(CAMEL_CONTEXT_YAML));
		after(_clean(CAMEL_CONTEXT_YAML));

		beforeEach(async function () {
			await utils.activateEditor(CAMEL_CONTEXT_YAML);
		});

		it('Open "camel-context.yaml" file inside Editor View', async function () {
			const editorName = await editor.getTitle();
			assert.equal(editorName, CAMEL_CONTEXT_YAML);
		});

		it('Code completion is working for component schemes (the part before the ":")', async function () {
			await utils.typeTextAtExt(7, URI_POSITION, 'timer');
			const expectedContentAssist = 'timer:timerName'
			contentAssist = await ca.waitUntilContentAssistContains(expectedContentAssist);
			const timer = await contentAssist.getItem(expectedContentAssist);
			assert.equal(await utils.getTextExt(timer), expectedContentAssist);
			await timer.click();

			assert.equal((await editor.getTextAtLine(7)).trim(), 'uri: timer:timerName');
		});

		it('Code completion is working for endpoint options (the part after the "?")', async function () {
			await utils.typeTextAtExt(7, URI_POSITION + 15, '?');
			contentAssist = await ca.waitUntilContentAssistContains('delay');
			const delay = await contentAssist.getItem('delay');
			assert.equal(await utils.getTextExt(delay), 'delay');
			await delay.click();

			assert.equal((await editor.getTextAtLine(7)).trim(), 'uri: timer:timerName?delay=1000');
		});

		it('Code completion is working for additional endpoint options (the part after "&")', async function () {
			await utils.typeTextAtExt(7, URI_POSITION + 26, '&exchange');
			contentAssist = await ca.waitUntilContentAssistContains('exchangePattern');
			const exchange = await contentAssist.getItem('exchangePattern');
			assert.equal(await utils.getTextExt(exchange), 'exchangePattern');
			await exchange.click();

			assert.equal((await editor.getTextAtLine(7)).trim(), 'uri: timer:timerName?delay=1000&exchangePattern=');

			await utils.typeTextAtExt(7, URI_POSITION + 43, 'In');
			contentAssist = await ca.waitUntilContentAssistContains('InOnly');
			const inOnly = await contentAssist.getItem('InOnly');
			assert.equal(await utils.getTextExt(inOnly), 'InOnly');
			await inOnly.click();

			assert.equal((await editor.getTextAtLine(7)).trim(), 'uri: timer:timerName?delay=1000&exchangePattern=InOnly');
		});
	});

	describe('Endpoint options filtering', function () {

		before(_setup(CAMEL_CONTEXT_YAML));
		after(_clean(CAMEL_CONTEXT_YAML));

		beforeEach(async function () {
			await utils.activateEditor(CAMEL_CONTEXT_YAML);
		});

		it('Duplicate endpoint options are filtered out', async function () {
			await utils.typeTextAtExt(7, URI_POSITION, 'timer');
			contentAssist = await ca.waitUntilContentAssistContains('timer:timerName');
			const timer = await contentAssist.getItem('timer:timerName');
			await timer.click();

			await utils.typeTextAtExt(7, URI_POSITION + 15, '?');
			contentAssist = await ca.waitUntilContentAssistContains('delay');
			const delay = await contentAssist.getItem('delay');
			await delay.click();

			await utils.typeTextAtExt(7, URI_POSITION + 26, '&');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.DEFAULT);
			const filtered = await contentAssist.hasItem('delay');

			assert.isFalse(filtered);
			await editor.toggleContentAssist(false);
		});
	});
});
