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

import { expect } from 'chai';
import { ActivityBar, DefaultTreeSection, EditorView, InputBox, Menu, SideBarView, VSBrowser, ViewItem, WebDriver, Workbench } from 'vscode-extension-tester';
import * as pjson from '../../../package.json';
import { EXAMPLE_TRANSFORM_COMMAND_JAVA_FILE, EXAMPLE_TRANSFORM_COMMAND_XML_FILE, EXAMPLE_TRANSFORM_COMMAND_YAML_FILE, FOLDER_WITH_RESOURCES_FOR_TRANSFORM_COMMAND, NEW_CAMEL_FILE_LABEL, TRANSFORM_CAMEL_ROUTE_YAML_DSL_LABEL, TRANSFORM_ROUTES_IN_FOLDER_TO_YAML_COMMAND_ID, TRANSFORM_ROUTE_TO_YAML_COMMAND_ID, deleteFile, killTerminal, openFileInEditor, waitUntilEditorIsOpened, waitUntilExtensionIsActivated } from '../utils/testUtils';

describe('Transform Camel Routes to YAML using commands', function () {
	this.timeout(600000);

	let driver: WebDriver;
	let input: InputBox;
	let sideBar: SideBarView;

	before(async function () {
		this.timeout(150000);
		driver = VSBrowser.instance.driver;

		await VSBrowser.instance.openResources(FOLDER_WITH_RESOURCES_FOR_TRANSFORM_COMMAND);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);

		sideBar = await (await new ActivityBar().getViewControl('Explorer'))?.openView() as SideBarView;
	});

	afterEach(async function () {
		await new EditorView().closeAllEditors();
		await killTerminal();
	});

	const routesToBeTransformed = [
		{ fileName: EXAMPLE_TRANSFORM_COMMAND_JAVA_FILE, fileExtension: '.java', type: 'Java' },
		{ fileName: EXAMPLE_TRANSFORM_COMMAND_XML_FILE, fileExtension: '.xml', type: 'XML' },
		{ fileName: EXAMPLE_TRANSFORM_COMMAND_YAML_FILE, fileExtension: '.yaml', type: 'YAML' }
	];

	routesToBeTransformed.forEach(function (route) {
		describe('Camel Transform Routes', function () {

			const INPUT_FILENAME: string = `transformedFrom${route.type}`;
			const FILENAME_CREATED_FROM_CAMEL_TRANSFORM: string = `transformedFrom${route.type}.camel.yaml`;

			after(async function () {
				await deleteFile(FILENAME_CREATED_FROM_CAMEL_TRANSFORM, FOLDER_WITH_RESOURCES_FOR_TRANSFORM_COMMAND);
			});

			it(`${route.type} to YAML`, async function () {
				const routeFile = route.fileName + route.fileExtension;

				await openFileInEditor(driver, FOLDER_WITH_RESOURCES_FOR_TRANSFORM_COMMAND, routeFile);
				await waitUntilEditorIsOpened(driver, routeFile, 45000);
				await driver.sleep(1000);
				await new Workbench().executeCommand(TRANSFORM_ROUTE_TO_YAML_COMMAND_ID);
				await driver.sleep(1000);

				input = await InputBox.create(45000);
				await input.setText(INPUT_FILENAME);
				await input.confirm();

				await waitUntilEditorIsOpened(driver, FILENAME_CREATED_FROM_CAMEL_TRANSFORM, 90000, 10000);

				const tree: DefaultTreeSection = await sideBar.getContent().getSection('camel_transform_command');
				const items = await tree.getVisibleItems();

				const labels = await Promise.all(items.map(item => item.getLabel()));
				expect(labels).contains(FILENAME_CREATED_FROM_CAMEL_TRANSFORM);
			});
		});
	});

	it('Transform files in folder to YAML', async function () {
		await new Workbench().executeCommand(TRANSFORM_ROUTES_IN_FOLDER_TO_YAML_COMMAND_ID);
		input = await InputBox.create(45000);

		// Confirm both prompts since we want to use the same folder as source and destination
		// Also avoids possible bug when confirming https://github.com/redhat-developer/vscode-extension-tester/issues/1278
		while (await input.isDisplayed()) {
			await input.confirm();
		}

		const tree: DefaultTreeSection = await sideBar.getContent().getSection('camel_transform_command');
		const items = await tree.getVisibleItems();
		const labels = await Promise.all(items.map(item => item.getLabel()));

		// Wait until all the transformed routes files are created
		await driver.wait(async function () {
			return routesToBeTransformed.every(route => labels.includes(route.fileName + route.fileExtension));
		}, 45000);

		// Asserts that every file was created
		routesToBeTransformed.forEach(async route => {
			const routeFile = route.fileName + '.yaml';
			expect(labels).contains(routeFile);
		});

	});

	// We can't use the OS native file selection dialog because it's not interactible.
	// Using the simple dialog provided by VSCode does not allow selecting more than one file/folder
	// See https://github.com/microsoft/vscode/issues/186637
	it.skip('Transform multiple files to YAML - simple file dialog does not allow selecting multiple files yet');

	it('Transform file to YAML using context menu', async function () {
		if (process.platform === "darwin"){
			//VSCode on MacOS uses native contextual menus making the test fail, so we skip it.
			this.skip();
		}
		const transformedFileName: string = `transformedFrom${EXAMPLE_TRANSFORM_COMMAND_XML_FILE}`;

		const item = await (await new SideBarView().getContent().getSection('camel_transform_command')).findItem(`${EXAMPLE_TRANSFORM_COMMAND_XML_FILE}.xml`) as ViewItem;
		const menu = await item.openContextMenu();

		const submenu = await menu.select(NEW_CAMEL_FILE_LABEL);

		if (submenu instanceof Menu) {
			await submenu.select(TRANSFORM_CAMEL_ROUTE_YAML_DSL_LABEL);
		} else {
			throw new Error(`Button ${TRANSFORM_CAMEL_ROUTE_YAML_DSL_LABEL} not found in context menu`);
		}

		await driver.sleep(1000);

		input = await InputBox.create(45000);
		await input.setText(transformedFileName);
		await input.confirm();

		await waitUntilEditorIsOpened(driver, `${transformedFileName}.camel.yaml`, 45000);

		const tree: DefaultTreeSection = await sideBar.getContent().getSection('camel_transform_command');
		const items = await tree.getVisibleItems();

		const labels = await Promise.all(items.map(item => item.getLabel()));
		expect(labels).contains(`${transformedFileName}.camel.yaml`);

		await deleteFile(`${transformedFileName}.camel.yaml`, FOLDER_WITH_RESOURCES_FOR_TRANSFORM_COMMAND);

	});
});

