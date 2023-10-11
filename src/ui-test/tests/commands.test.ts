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

import * as fs from 'fs';
import { expect } from 'chai';
import {
	ActivityBar,
	DefaultTreeSection,
	EditorView,
	InputBox,
	SideBarView,
	TerminalView,
	VSBrowser,
	WebDriver,
	Workbench
} from 'vscode-uitests-tooling';
import {
	activateEditor,
	COMMAND_JAVA_FILE,
	COMMAND_XML_FILE,
	COMMAND_YAML_FILE,
	CREATE_COMMAND_JAVA,
	CREATE_COMMAND_QUARKUS,
	CREATE_COMMAND_SPRINGBOOT,
	CREATE_COMMAND_XML,
	CREATE_COMMAND_YAML,
	deleteFile,
	getFileContent,
	killTerminal,
	RESOURCES,
	SPECIFIC_WORKSPACE_FOLDERNAME_PREFIX,
	SPECIFIC_WORKSPACE_PREFIX,
	waitUntilEditorIsOpened,
	waitUntilExtensionIsActivated
} from '../utils/testUtils';
import * as pjson from '../../../package.json';
import { integer } from 'vscode-languageclient';

let driver: WebDriver;
let input: InputBox;
let sideBar: SideBarView;

describe('Create a Camel Route using command', function () {
	this.timeout(400000);

	before(async function () {
		this.timeout(200000);
		driver = VSBrowser.instance.driver;

		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
	});

	const DSL_LIST = [
		// DSL, COMMAND, FILENAME, FILENAME LONG, EXAMPLE FILE
		['XML', CREATE_COMMAND_XML, 'xmlSample', 'xmlSample.camel.xml', COMMAND_XML_FILE],
		['Java', CREATE_COMMAND_JAVA, 'Java', 'Java.java', COMMAND_JAVA_FILE],
		['Yaml', CREATE_COMMAND_YAML, 'yamlSample', 'yamlSample.camel.yaml', COMMAND_YAML_FILE]
	];

	DSL_LIST.forEach(function (dsl) {
		const DSL = dsl.at(0);
		const COMMAND = dsl.at(1);
		const FILENAME = dsl.at(2);
		const FILENAME_LONG = dsl.at(3);
		const EXAMPLE = dsl.at(4);

		describe(`${DSL} DSL`, function () {

			before(async function () {
				sideBar = await (await new ActivityBar().getViewControl('Explorer'))?.openView();
				await deleteFile(FILENAME_LONG, RESOURCES);
			});

			after(async function () {
				await new EditorView().closeAllEditors();
				await deleteFile(FILENAME_LONG, RESOURCES);
				await killTerminal();
			});

			it('Create file', async function () {
				await new Workbench().executeCommand(COMMAND);

				await driver.wait(async function () {
					input = await InputBox.create();
					return (await input.isDisplayed());
				}, 30000);
				await input.setText(FILENAME);
				await input.confirm();

				await waitUntilEditorIsOpened(driver, FILENAME_LONG);
			});

			it('File available', async function () {
				const tree = await sideBar.getContent().getSection('resources') as DefaultTreeSection;
				const items = await tree.getVisibleItems();

				const labels = await Promise.all(items.map(item => item.getLabel()));
				expect(labels).contains(FILENAME_LONG);
			});

			it('Check file content', async function () {
				const editor = await activateEditor(driver, FILENAME_LONG);
				const text = await editor.getText();
				expect(text).equals(getFileContent(EXAMPLE, RESOURCES));
			});
		});

	});
});

describe('Create a Camel Project using command', function () {
	this.timeout(400000);

	let currentWorkspaceIndex :integer = 0;

	before(async function () {
		currentWorkspaceIndex++;
		this.timeout(200000);
		driver = VSBrowser.instance.driver;
		const currentWorkspacePath = SPECIFIC_WORKSPACE_PREFIX + currentWorkspaceIndex;

		fs.mkdirSync(currentWorkspacePath, { recursive: true });

		await VSBrowser.instance.openResources(currentWorkspacePath);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
	});

	before(async function () {
		sideBar = await (await new ActivityBar().getViewControl('Explorer'))?.openView();
	});

	after(async function () {
		await new EditorView().closeAllEditors();
		await new TerminalView().click();
		await new Workbench().executeCommand('View: Toggle Maximized Panel');
		await VSBrowser.instance.takeScreenshot('Screenshot with terminal maximized');
		console.log(await new TerminalView().getText());
		await new TerminalView().killTerminal();
		await new Workbench().closeFolder();
		const currentWorkspacePath = SPECIFIC_WORKSPACE_PREFIX + currentWorkspaceIndex;
		await driver.wait(async () => {
			try {
				fs.rmSync(currentWorkspacePath, { recursive: true, maxRetries: 100, force: true, retryDelay: 60});
			} catch {
				return false;
			}
			return true;
		}, 60000);
	});

	const COMMANDS = [CREATE_COMMAND_QUARKUS, CREATE_COMMAND_SPRINGBOOT];

	COMMANDS.forEach(command => {

		it(`Create Project ${command}`, async function () {
			await new Workbench().executeCommand(command);

			await driver.wait(async function () {
				input = await InputBox.create();
				return (await input.isDisplayed());
			}, 30000);
			await input.setText('com.demo:test:1.0-SNAPSHOT');
			await input.confirm();

			const tree = await sideBar.getContent().getSection(SPECIFIC_WORKSPACE_FOLDERNAME_PREFIX + currentWorkspaceIndex) as DefaultTreeSection;
			await driver.wait(async () => {
				const items = await tree.getVisibleItems();

				const labels = await Promise.all(items.map(item => item.getLabel()));
				return labels.includes('pom.xml');
			}, 30000);
		});
	});
});
