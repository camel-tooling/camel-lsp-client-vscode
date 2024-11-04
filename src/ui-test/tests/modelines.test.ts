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
	EditorView,
	MarkerType,
	TextEditor,
	VSBrowser,
	WebDriver
} from "vscode-extension-tester";
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
import * as ca from '../utils/contentAssist';
import * as pjson from '../../../package.json';
import * as path from 'path';

describe('Camel-K modelines support', function () {
	this.timeout(120000);

	let driver: WebDriver;
	let editor: TextEditor;
	let contentAssist: ContentAssist;

	const TESTFILE = 'CamelK.java';

	before(async function () {
		this.timeout(90000);
		driver = VSBrowser.instance.driver;

		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
		await (await new ActivityBar().getViewControl('Explorer'))?.openView();

		await deleteFile(TESTFILE, RESOURCES); // prevent failure
		await createNewFile(driver, TESTFILE);
	});

	after(async function () {
		await new EditorView().closeAllEditors();
		await deleteFile(TESTFILE, RESOURCES);
	});

	beforeEach(async function () {
		await VSBrowser.instance.openResources(path.join(RESOURCES, TESTFILE));
		editor = await activateEditor(driver, TESTFILE);
		await editor.typeText('// camel-k: ');
	});

	afterEach(async function () {
		await editor.clearText(); // clear file after each test
		await closeEditor(TESTFILE, false);
	});

	it('trait definition names', async function () {
		editor = await activateEditor(driver, TESTFILE);
		await selectFromCA('trait');
		await editor.typeText('=');
		await selectFromCA('affinity');
		await selectFromCA('enabled');
		assert.equal((await editor.getTextAtLine(1)).trim(), '// camel-k: trait=affinity.enabled=');
	});

	it('property and option names', async function () {
		editor = await activateEditor(driver, TESTFILE);
		await selectFromCA('property');
		await editor.typeText('=');
		await selectFromCA('camel');
		await selectFromCA('component');
		await selectFromCA('timer');
		await editor.typeText('.');
		await selectFromCA('bridgeErrorHandler');
		assert.equal((await editor.getTextAtLine(1)).trim(), '// camel-k: property=camel.component.timer.bridgeErrorHandler=false');
	});

	it('diagnostic for duplicated trait properties', async function () {
		const EXPECTED_ERROR_MESSAGE = 'More than one trait defines the same property: affinity.enabled';

		editor = await activateEditor(driver, TESTFILE);
		await selectFromCA('trait');
		await editor.typeText('=');
		await selectFromCA('affinity');
		await selectFromCA('enabled');
		await editor.typeText(' ');
		await selectFromCA('trait');
		await editor.typeText('=');
		await selectFromCA('affinity');
		await selectFromCA('enabled');
		assert.equal((await editor.getTextAtLine(1)).trim(), '// camel-k: trait=affinity.enabled= trait=affinity.enabled=');

		const problemsView = await openProblemsView();
		await driver.wait(async function () {
			const innerMarkers = await problemsView.getAllVisibleMarkers(MarkerType.Error);
			return innerMarkers.length > 0;
		}, 5000);
		const markers = await problemsView.getAllVisibleMarkers(MarkerType.Error);
		assert.isNotEmpty(markers, 'Problems view does not contains duplicated trait error.');

		const errorMessage = await markers[0].getText();
		assert.include(errorMessage, EXPECTED_ERROR_MESSAGE);
		await new BottomBarPanel().toggle(false); // close Problems View
	});

	it('Camel artifact id for dependency', async function () {
		editor = await activateEditor(driver, TESTFILE);
		await selectFromCA('dependency');
		await editor.typeText('=');
		await selectFromCA('camel-amqp');
		assert.equal((await editor.getTextAtLine(1)).trim(), '// camel-k: dependency=camel-amqp');
	});

	it('mvn dependency', async function () {
		editor = await activateEditor(driver, TESTFILE);
		await selectFromCA('dependency');

		// workaround for https://issues.redhat.com/browse/FUSETOOLS2-2203
		await editor.typeText('=mvn');
		contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
		const items = await contentAssist.getItems();
		const item = items.at(0);
		await item?.click();

		assert.equal((await editor.getTextAtLine(1)).trim(), '// camel-k: dependency=mvn:groupId:artifactId:version');
	});

	/**
	 * Select specific item from Content Assist proposals.
	 *
	 * @param expectedItem Expected item in Content Assist.
	 */
	async function selectFromCA(expectedItem: string, timeout = 10000): Promise<void> {
		contentAssist = await ca.waitUntilContentAssistContains(expectedItem, timeout);
		const item = await getItem(expectedItem, 60000);
		assert.equal(await getTextExt(item), expectedItem);
		await item.click();
	}

	async function getItem(label: string, timeout: number = 30000): Promise<ContentAssistItem> {
		return await driver.wait(() => contentAssist.getItem(label),
			timeout, `Could not find item with label "${label}".`
		) as ContentAssistItem;
	}
});
