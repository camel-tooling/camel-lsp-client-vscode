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

import { afterEach } from 'mocha';
import * as fs from 'node:fs';
import path from 'path';
import {
	ActivityBar,
	DefaultTreeSection,
	EditorView,
	InputBox,
	ModalDialog,
	ViewControl,
	VSBrowser,
	WebDriver,
	Workbench
} from 'vscode-extension-tester';
import * as pjson from '../../../package.json';
import {
	CREATE_COMMAND_QUARKUS_ID,
	expandItemInTree,
	killTerminal,
	SPECIFIC_WORKSPACE_NAME,
	SPECIFIC_WORKSPACE_PATH,
	TASK_FINISHED_IN_TERMINAL_TEXT,
	waitUntilExtensionIsActivated,
	waitUntilFileAvailable,
	waitUntilModalDialogIsDisplayed,
	waitUntilTerminalHasText
} from '../utils/testUtils';

describe('Create a Camel Project in a new output folder', function () {
	this.timeout(600000);
	let driver: WebDriver;
	let input: InputBox;

	before(async function () {
		driver = VSBrowser.instance.driver;
		fs.mkdirSync(SPECIFIC_WORKSPACE_PATH, { recursive: true });
	});

	after(async function () {
		await new EditorView().closeAllEditors();
		await killTerminal();
	});

	const command = CREATE_COMMAND_QUARKUS_ID;


	describe(`${command}`, function () {

		beforeEach(async function () {
			this.timeout(400000);
			await VSBrowser.instance.openResources(SPECIFIC_WORKSPACE_PATH);
			await VSBrowser.instance.waitForWorkbench();
			await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
			await (await new ActivityBar().getViewControl('Explorer'))?.openView();
		});

		afterEach(async function () {
			await new EditorView().closeAllEditors();
			await killTerminal();
		});

		it(`Using command ${command}`, async function () {
			const SUBFOLDER = `sub-folder-${CREATE_COMMAND_QUARKUS_ID}`;
			const SUBFOLDER_FOLDER_PATH = path.join(SPECIFIC_WORKSPACE_PATH, SUBFOLDER);
			fs.mkdirSync(SUBFOLDER_FOLDER_PATH, { recursive: true });

			await new Workbench().executeCommand(command);

			input = await InputBox.create(30000);
			await input.setText('com.demo:test:1.0-SNAPSHOT');
			await input.confirm();

			input = await InputBox.create(30000);
			const inputText = await input.getText();
			await input.setText(path.join(inputText, SUBFOLDER));
			await input.confirm();
			await input.confirm();
			const dialog = new ModalDialog();
			await waitUntilModalDialogIsDisplayed(driver, dialog);
			await dialog.pushButton('Continue');

			//Expands the new folder under the workspace so that it can be visible later
			await waitUntilTerminalHasText(driver, TASK_FINISHED_IN_TERMINAL_TEXT);
			const control = await new ActivityBar().getViewControl('Explorer') as ViewControl;
			const sideBar = await control.openView();
			const tree: DefaultTreeSection = await sideBar.getContent().getSection(SPECIFIC_WORKSPACE_NAME);
			await expandItemInTree(driver, SUBFOLDER, tree);
			await waitUntilFileAvailable(driver, 'pom.xml', SPECIFIC_WORKSPACE_NAME, 60000);
		});
	});
});
