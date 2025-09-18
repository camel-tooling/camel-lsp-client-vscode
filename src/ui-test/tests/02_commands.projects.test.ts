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
import * as pjson from '../../../package.json';
import {
	CREATE_COMMAND_QUARKUS_ID,
	CREATE_COMMAND_SPRINGBOOT_ID,
	expandItemInTree,
	killTerminal,
	SPECIFIC_WORKSPACE_NAME,
	SPECIFIC_WORKSPACE_PATH,
	TASK_FINISHED_IN_TERMINAL_TEXT,
	waitUntilExtensionIsActivated,
	waitUntilFileAvailable,
	waitUntilTerminalHasText
} from '../utils/testUtils';

describe('Create a Camel Project', function () {
	this.timeout(600000);
	let driver: WebDriver;

	before(async function () {
		driver = VSBrowser.instance.driver;
		fs.mkdirSync(SPECIFIC_WORKSPACE_PATH, { recursive: true });
	});

	after(async function () {
		await new EditorView().closeAllEditors();
		await killTerminal();
	});

	describe('Using command', function () {
		let input: InputBox;
		let sideBar: SideBarView;

		const COMMANDS = [CREATE_COMMAND_QUARKUS_ID, CREATE_COMMAND_SPRINGBOOT_ID];

		COMMANDS.forEach(command => {
			describe(`${command}`, function () {

				beforeEach(async function () {
					this.timeout(400000);
					await VSBrowser.instance.openResources(SPECIFIC_WORKSPACE_PATH);
					await VSBrowser.instance.waitForWorkbench();
					await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
					sideBar = await (await new ActivityBar().getViewControl('Explorer'))?.openView() as SideBarView;
				});

				afterEach(async function () {
					await new EditorView().closeAllEditors();
					await killTerminal();
				});

				it(`Create project`, async function () {
					await new Workbench().executeCommand(command);
					input = await InputBox.create(30000);
					await input.setText('com.demo:test:1.0-SNAPSHOT');
					await driver.sleep(1000);
					await input.confirm();

					input = await InputBox.create(30000);
					await input.confirm();
					await waitUntilTerminalHasText(driver, TASK_FINISHED_IN_TERMINAL_TEXT);
					await waitUntilFileAvailable(driver, 'pom.xml', SPECIFIC_WORKSPACE_NAME, 60000);
				});

				(command.includes('quarkus') ? it : it.skip)(`Init .vscode folder with config files`, async function () {
					const tree: DefaultTreeSection = await sideBar.getContent().getSection(SPECIFIC_WORKSPACE_NAME);
					await expandItemInTree(driver, '.vscode', tree);
					await driver.wait(async () => {
						const items = await tree.getVisibleItems();
						const labels = await Promise.all(items.map(item => item.getLabel()));
						return labels.includes('.vscode') && labels.includes('tasks.json') && labels.includes('launch.json');
					}, 30000, 'Could not find .vscode folder with tasks.json and launch.json files!');
				});

			});
		});
	});
});
