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

import { assert } from "chai";
import {
	ActivityBar,
	BottomBarPanel,
	ContentAssist,
	ContentAssistItem,
	MarkerType,
	TextEditor,
	VSBrowser,
	WebDriver
} from "vscode-extension-tester";
import * as ca from '../utils/contentAssist';
import {
	activateEditor,
	closeEditor,
	createNewFile,
	deleteFile,
	getTextExt,
	openProblemsView,
	RESOURCES,
	waitUntilExtensionIsActivated
} from "../utils/testUtils";
import * as pjson from '../../../package.json';

describe('Camel properties auto-completion support', function () {
	this.timeout(120000);

	const TEST_FILE = 'test.properties';

	let driver: WebDriver;
	let editor: TextEditor;
	let contentAssist: ContentAssist;

	before(async function () {
		this.timeout(250000);
		driver = VSBrowser.instance.driver;

		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`, 200000, 20000);
		await (await new ActivityBar().getViewControl('Explorer'))?.openView();

		await createNewFile(driver, TEST_FILE);
	});

	after(async function () {
		await closeEditor(TEST_FILE, true);
		await deleteFile(TEST_FILE, RESOURCES);
	});

	afterEach(async function () {
		await editor.clearText(); // clear file after each test
	});

	it('completion for possible enum values and booleans of a Camel component property', async function () {
		editor = await activateEditor(driver, TEST_FILE);
		await editor.typeText('camel.');
		await selectFromCA('component');
		await selectFromCA('amqp');
		assert.equal((await editor.getTextAtLine(1)).trim(), 'camel.component.amqp');
	});

	it('the default values are automatically added when auto-completing Camel component properties', async function () {
		editor = await activateEditor(driver, TEST_FILE);
		await editor.typeText('camel.component.amqp.');
		await selectFromCA('acceptMessagesWhileStopping');
		assert.equal((await editor.getTextAtLine(1)).trim(), 'camel.component.amqp.acceptMessagesWhileStopping=false'); // default value 'false' is added
	});

	it('provide filtered completion when in middle of a component id, component property or value', async function () {
		editor = await activateEditor(driver, TEST_FILE);
		await editor.typeText('camel.component.n');
		contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
		assert.isTrue(await testFilteredCompletion('nats', 'amqp'));
	});

	it('support insert-and-replace completion', async function () {
		editor = await activateEditor(driver, TEST_FILE);
		await editor.typeText('camel.component.telegram.authorizationToken=false');
		await editor.moveCursor(1, 27);
		await selectFromCA('autowiredEnabled');
		assert.equal((await editor.getTextAtLine(1)).trim(), 'camel.component.telegram.autowiredEnabled=false');
	});

	it('code diagnostic is working', async function () {
		editor = await activateEditor(driver, TEST_FILE);
		await editor.typeText('camel.component.telegram.authorizationTokn=');

		const EXPECTED_ERROR_MESSAGE = 'Unknown option';
		const problemsView = await openProblemsView();
		await driver.wait(async function () {
			const innerMarkers = await problemsView.getAllVisibleMarkers(MarkerType.Error);
			return innerMarkers.length > 0;
		}, 30_000);
		const markers = await problemsView.getAllVisibleMarkers(MarkerType.Error);
		assert.isNotEmpty(markers, 'Problems view does not contains expected error');

		const errorMessage = await markers[0].getText();
		assert.include(errorMessage, EXPECTED_ERROR_MESSAGE); // expected error message is included
		await new BottomBarPanel().toggle(false); // close Problems View
	});

	/**
	 * Select specific item from Content Assist proposals.
	 *
	 * @param expectedItem Expected item in Content Assist.
	 */
	async function selectFromCA(expectedItem: string): Promise<void> {
		contentAssist = await ca.waitUntilContentAssistContains(expectedItem);
		const item = await contentAssist.getItem(expectedItem) as ContentAssistItem;
		assert.equal(await getTextExt(item), expectedItem);
		await item.click();
	}

	/**
	 * Test for filtration of values in content assist.
	 *
	 * @param availableItem Item which must be available in CA.
	 * @param notAvailableItem Item which should NOT be available in CA.
	 * @returns true/false
	 */
	async function testFilteredCompletion(availableItem: string, notAvailableItem: string): Promise<boolean> {
		try {
			contentAssist = await ca.waitUntilContentAssistContains(availableItem);
			await ca.waitUntilContentAssistContains(notAvailableItem, 5_000);
			return false;
		} catch (error) {
			return true;
		}
	}
});
