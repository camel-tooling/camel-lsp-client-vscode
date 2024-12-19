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

import * as fs from 'node:fs';
import path from 'path';
import {
	ActivityBar,
	CustomTreeSection,
	DefaultTreeSection,
	EditorView,
	InputBox,
	ModalDialog,
	SideBarView,
	ViewContent,
	ViewControl,
	VSBrowser,
	WebDriver,
	WelcomeContentSection,
	Workbench
} from 'vscode-extension-tester';
import * as pjson from '../../../package.json';
import {
	CREATE_COMMAND_QUARKUS_ID,
	CREATE_COMMAND_SPRINGBOOT_ID,
	killTerminal,
	SPECIFIC_WORKSPACE_NAME,
	SPECIFIC_WORKSPACE_PATH,
	waitUntilExtensionIsActivated,
	waitUntilFileAvailable
} from '../utils/testUtils';

describe('Create a Camel Project', function () {
	this.timeout(600000);
	let driver: WebDriver;
	const SUBFOLDER = 'sub-folder';
	const SUBFOLDER_FOLDER_PATH = path.join(SPECIFIC_WORKSPACE_PATH, SUBFOLDER);
	const CREATE_PROJECT_BUTTON = 'Create a Camel project';
	const NO_FOLDER_OPENED_SECTION = 'No Folder Opened';

	before(async function () {
		fs.mkdirSync(SUBFOLDER_FOLDER_PATH, { recursive: true });
		driver = VSBrowser.instance.driver;
	});

	after(async function () {
		await new EditorView().closeAllEditors();
		await killTerminal();
		await new Workbench().executeCommand('Workspaces: Close Workspace');
		await VSBrowser.instance.waitForWorkbench();
		fs.rmSync(SPECIFIC_WORKSPACE_PATH, { recursive: true, maxRetries: 100, force: true, retryDelay: 60 });
	});

	describe('Using command', function () {
		let input: InputBox;
		let sideBar: SideBarView;

		const COMMANDS = [CREATE_COMMAND_QUARKUS_ID, CREATE_COMMAND_SPRINGBOOT_ID];

		COMMANDS.forEach(command => {
			describe(`${command}`, function () {

				before(async function () {
					this.timeout(200000);
					await VSBrowser.instance.openResources(SPECIFIC_WORKSPACE_PATH);
					await VSBrowser.instance.waitForWorkbench();
					await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
					sideBar = await (await new ActivityBar().getViewControl('Explorer'))?.openView() as SideBarView;
				});

				after(async function () {
					await new EditorView().closeAllEditors();
					await killTerminal();
					await new Workbench().executeCommand('Workspaces: Close Workspace');
					await VSBrowser.instance.waitForWorkbench();
				});

				it(`Create project`, async function () {

					await new Workbench().executeCommand(command);

					input = await InputBox.create(30000);
					await input.setText('com.demo:test:1.0-SNAPSHOT');
					await driver.sleep(1000);
					await input.confirm();

					input = await InputBox.create(30000);
					await input.confirm();

					await waitUntilFileAvailable(driver, 'pom.xml', SPECIFIC_WORKSPACE_NAME, 60000);
				});

				(command.includes('quarkus') ? it : it.skip)(`Init .vscode folder with config files`, async function () {
					const tree = await sideBar.getContent().getSection(SPECIFIC_WORKSPACE_NAME) as DefaultTreeSection;
					await driver.wait(async () => {
						const item = await tree.findItem('.vscode');
						if (item) {
							await item.expand();
							return true;
						} else {
							return false;
						}
					}, 10000, 'Could not expand .vscode folder');
					await driver.wait(async () => {
						const items = await tree.getVisibleItems();
						const labels = await Promise.all(items.map(item => item.getLabel()));
						return labels.includes('.vscode') && labels.includes('tasks.json') && labels.includes('launch.json');
					}, 30000, 'Could not find .vscode folder with tasks.json and launch.json files!');
				});

				it('Create project with different output folder', async function () {

					await new Workbench().executeCommand(command);

					input = await InputBox.create(30000);
					await input.setText('com.demo:test:1.0-SNAPSHOT');
					await driver.sleep(1000);
					await input.confirm();

					input = await InputBox.create(30000);
					const inputText = await input.getText();
					await driver.sleep(1000);
					await input.setText(path.join(inputText, SUBFOLDER));
					await driver.sleep(1000);
					while (await input.isDisplayed()) {
						await input.confirm();
					}
					await driver.sleep(1000);
					const dialog = new ModalDialog();
					await dialog.pushButton('Continue');
					await driver.sleep(1000);

					//Expands the new folder under the workspace so that it can be visible later
					const control = await new ActivityBar().getViewControl('Explorer') as ViewControl;
					const sideBar = await control.openView();
					const tree: DefaultTreeSection = await sideBar.getContent().getSection(SPECIFIC_WORKSPACE_NAME);
					const items = await tree.getVisibleItems();
					await Promise.all(items.map(async item => {
						if (await item.getLabel() === SUBFOLDER) {
							await item.expand();
						}
					}));
					await driver.sleep(1000);

					await waitUntilFileAvailable(driver, 'pom.xml', SPECIFIC_WORKSPACE_NAME, 60000);
				});
			});
		});

	});

	describe('Using welcome content button', () => {

		let section: CustomTreeSection;
		let content: ViewContent;
		let input: InputBox;

		before(async function () {
			this.timeout(200000);
			await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
			const view = await ((await new ActivityBar().getViewControl('Explorer')) as ViewControl).openView();
			content = view.getContent();

			section = await content.getSection(NO_FOLDER_OPENED_SECTION);
		});

		after(async () => {
			await ((await new ActivityBar().getViewControl('Explorer')) as ViewControl).closeView();
		});

		it(`Using button in section '${NO_FOLDER_OPENED_SECTION}'`, async function () {
			const buttons = await ((await section.findWelcomeContent()) as WelcomeContentSection).getButtons();
			// Find the correct button and click it
			buttons.forEach(async (button) => {
				if (await button.getTitle() === CREATE_PROJECT_BUTTON) {
					await button.click();
				}
			});

			input = await InputBox.create(30000);
			await input.setText('quarkus');
			await driver.sleep(1000);
			await input.confirm();

			input = await InputBox.create(30000);
			await input.setText('com.demo:test:1.0-SNAPSHOT');
			await driver.sleep(1000);
			await input.confirm();

			input = await InputBox.create(30000);
			await input.setText(SPECIFIC_WORKSPACE_PATH);
			await driver.sleep(1000);
			while (await input.isDisplayed()) {
				await input.confirm();
			}

			await driver.sleep(1000);
			await VSBrowser.instance.openResources(SPECIFIC_WORKSPACE_PATH);
			await VSBrowser.instance.waitForWorkbench();
			await driver.sleep(1000);
			await waitUntilFileAvailable(driver, 'pom.xml', SPECIFIC_WORKSPACE_NAME, 60000);

		});

	});
});
