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
	EditorView,
	BottomBarPanel,
	MarkerType,
	VSBrowser,
	WebDriver,
	TextEditor,
	ContentAssist,
	WaitUntil,
	DefaultWait
} from 'vscode-uitests-tooling';
import { assert } from 'chai';
import * as path from 'path';
import * as utils from '../utils/testUtils';
import * as ca from '../utils/contentAssist';

describe('Java DSL support', function () {
	this.timeout(60000);

	const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');
	const CAMEL_CONTEXT_JAVA = 'camel-context.java';
	const URI_POSITION = 15;

	let contentAssist: ContentAssist;
	let driver: WebDriver;

	before(async function () {
		this.timeout(20000);
		driver = VSBrowser.instance.driver;
		VSBrowser.instance.waitForWorkbench();
	});

	const _setup = function (camel_java: string) {
		return async function () {
			this.timeout(20000);
			await new EditorView().closeAllEditors();
			const absoluteCamelJavaPath = path.join(RESOURCES, camel_java);
			await VSBrowser.instance.openResources(absoluteCamelJavaPath);
		}
	};

	const _clean = function (camel_java: string) {
		return async function () {
			this.timeout(15000);
			await utils.closeEditor(camel_java, false);
		}
	};

	describe('Camel URI code completion', function () {

		before(_setup(CAMEL_CONTEXT_JAVA));
		after(_clean(CAMEL_CONTEXT_JAVA));

		it('Open "camel-context.java" file inside Editor View', async function () {
			const editor = await new EditorView().openEditor(CAMEL_CONTEXT_JAVA);
			const editorName = await editor.getTitle();
			assert.equal(editorName, CAMEL_CONTEXT_JAVA);
		});

		it('Code completion is working for component schemes (the part before the ":")', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(9, URI_POSITION, 'timer');
			const expectedContentAssist = 'timer:timerName';
			contentAssist = await ca.waitUntilContentAssistContains(driver, contentAssist, editor, expectedContentAssist);
			const timer = await contentAssist.getItem(expectedContentAssist);
			assert.equal(await utils.getTextExt(timer), expectedContentAssist);
			await timer.click();

			assert.equal((await editor.getTextAtLine(9)).trim(), 'from("timer:timerName").routeId("_fromID");');
		});

		it('Code completion is working for endpoint options (the part after the "?")', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(9, URI_POSITION + 15, '?');
			contentAssist = await ca.waitUntilContentAssistContains(driver, contentAssist, editor, 'delay');
			const delay = await contentAssist.getItem('delay');
			assert.equal(await utils.getTextExt(delay), 'delay');
			await delay.click();

			assert.equal((await editor.getTextAtLine(9)).trim(), 'from("timer:timerName?delay=1000").routeId("_fromID");');
		});

		it('Code completion is working for additional endpoint options (the part after "&")', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(9, URI_POSITION + 26, '&');
			contentAssist = await ca.waitUntilContentAssistContains(driver, contentAssist, editor, 'exchangePattern');
			const exchange = await contentAssist.getItem('exchangePattern');
			assert.equal(await utils.getTextExt(exchange), 'exchangePattern');
			await exchange.click()

			assert.equal((await editor.getTextAtLine(9)).trim(), 'from("timer:timerName?delay=1000&exchangePattern=").routeId("_fromID");');

			await editor.typeTextAt(9, URI_POSITION + 43, 'In');
			contentAssist = await ca.waitUntilContentAssistContains(driver, contentAssist, editor, 'InOnly');
			const inOnly = await contentAssist.getItem('InOnly');
			assert.equal(await utils.getTextExt(inOnly), 'InOnly');
			await inOnly.click();

			assert.equal((await editor.getTextAtLine(9)).trim(), 'from("timer:timerName?delay=1000&exchangePattern=InOnly").routeId("_fromID");');
		});
	});

	describe('Endpoint options filtering', function () {

		before(_setup(CAMEL_CONTEXT_JAVA));
		after(_clean(CAMEL_CONTEXT_JAVA));

		it('Duplicate endpoint options are filtered out', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(9, URI_POSITION, 'timer');
			contentAssist = await ca.waitUntilContentAssistContains(driver, contentAssist, editor, 'timer:timerName');
			const timer = await contentAssist.getItem('timer:timerName');
			await timer.click();

			await editor.typeTextAt(9, URI_POSITION + 15, '?');
			contentAssist = await ca.waitUntilContentAssistContains(driver, contentAssist, editor, 'delay');
			const delay = await contentAssist.getItem('delay');
			await delay.click();

			await editor.typeTextAt(9, URI_POSITION + 26, '&de');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.DEFAULT);
			const filtered = await contentAssist.hasItem('delay');

			assert.isFalse(filtered);
			await editor.toggleContentAssist(false);
		});
	});

	describe('Diagnostics for Camel URIs', function () {

		const EXPECTED_ERROR_MESSAGE = 'Invalid duration value: 1000r';

		beforeEach(_setup(CAMEL_CONTEXT_JAVA));
		afterEach(_clean(CAMEL_CONTEXT_JAVA));

		it('LSP diagnostics support for XML DSL', async function () {
			this.retries(3);
			const editor = new TextEditor();

			await editor.typeTextAt(9, URI_POSITION, 'timer');
			contentAssist = await ca.waitUntilContentAssistContains(driver, contentAssist, editor, 'timer:timerName');
			const timer = await contentAssist.getItem('timer:timerName');
			await timer.click();

			await editor.typeTextAt(9, URI_POSITION + 15, '?');
			contentAssist = await ca.waitUntilContentAssistContains(driver, contentAssist, editor, 'delay');
			const delay = await contentAssist.getItem('delay');
			await delay.click();

			await editor.typeTextAt(9, URI_POSITION + 26, 'r');
			const problemsView = await utils.openView('Problems');

			await driver.wait(async function () {
				const innerMarkers = await problemsView.getAllMarkers(MarkerType.Error);
				return innerMarkers.length > 0;
			}, DefaultWait.TimePeriod.MEDIUM);
			const markers = await problemsView.getAllMarkers(MarkerType.Error);
			assert.isNotEmpty(markers, 'Problems view does not contains expected error');

			const errorMessage = await markers[0].getText();
			assert.include(errorMessage, EXPECTED_ERROR_MESSAGE);
			await new BottomBarPanel().toggle(false); // close Problems View
		});
	});
});
