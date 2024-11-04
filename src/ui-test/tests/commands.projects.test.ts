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
import {
	ActivityBar,
	DefaultTreeSection,
	EditorView,
	InputBox,
	SideBarView,
	VSBrowser,
	WebDriver,
	Workbench
} from 'vscode-extension-tester';
import {
	CREATE_COMMAND_QUARKUS_ID,
	CREATE_COMMAND_SPRINGBOOT_ID,
	killTerminal,
	SPECIFIC_WORKSPACE_NAME,
	SPECIFIC_WORKSPACE_PATH,
	waitUntilFileAvailable,
	waitUntilExtensionIsActivated
} from '../utils/testUtils';
import * as pjson from '../../../package.json';

describe('Create a Camel Project using command', function () {
	this.timeout(400000);

	let driver: WebDriver;
	let input: InputBox;
	let sideBar: SideBarView;

	const COMMANDS = [CREATE_COMMAND_QUARKUS_ID, CREATE_COMMAND_SPRINGBOOT_ID];

	COMMANDS.forEach(command => {
		describe(`${command}`, function () {

			before(async function () {
				this.timeout(200000);
				driver = VSBrowser.instance.driver;
				fs.mkdirSync(SPECIFIC_WORKSPACE_PATH, { recursive: true });
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
				fs.rmSync(SPECIFIC_WORKSPACE_PATH, { recursive: true, maxRetries: 100, force: true, retryDelay: 60 });
			});

			it(`Create project`, async function () {
				await new Workbench().executeCommand(command);

				await driver.wait(async function () {
					input = await InputBox.create();
					return input;
				}, 30000);
				await input.setText('com.demo:test:1.0-SNAPSHOT');
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
		});
	});
});
