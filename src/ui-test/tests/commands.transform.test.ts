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

import { expect } from "chai";
import { ActivityBar, DefaultTreeSection, EditorView, InputBox, SideBarView, VSBrowser, WebDriver, Workbench } from "vscode-uitests-tooling";
import * as pjson from '../../../package.json';
import * as testUtils from "../utils/testUtils";

describe('Transform Camel Routes to YAML using command', function () {
	this.timeout(600000);

	let driver: WebDriver;
	let input: InputBox;
	let sideBar: SideBarView;

	before(async function () {
		this.timeout(200000);
		driver = VSBrowser.instance.driver;

		await VSBrowser.instance.openResources(testUtils.RESOURCES_TRANSFORM_COMMAND);
		await VSBrowser.instance.waitForWorkbench();

		await testUtils.waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
	});

	const routesToBeTransformed = [
		{ sourceFile: testUtils.EXAMPLE_TRANSFORM_COMMAND_JAVA_FILE, type: 'Java' },
		{ sourceFile: testUtils.EXAMPLE_TRANSFORM_COMMAND_XML_FILE, type: 'XML' },
		{ sourceFile: testUtils.EXAMPLE_TRANSFORM_COMMAND_YAML_FILE, type: 'YAML' }
	];
	routesToBeTransformed.forEach(function (route) {
		describe('Camel Transform Routes', function () {

			const FILENAME_CREATED_FROM_CAMEL_TRANSFORM: string = `transformedFrom${route.type}.yaml`;

			before(async function () {
				sideBar = await (await new ActivityBar().getViewControl('Explorer'))?.openView();
			});

			after(async function () {
				await new EditorView().closeAllEditors();
				await testUtils.killTerminal();
				await testUtils.deleteFile(FILENAME_CREATED_FROM_CAMEL_TRANSFORM, testUtils.RESOURCES_TRANSFORM_COMMAND);
			});

			it(`${route.type} to YAML`, async function () {

				await testUtils.openFileInEditor(driver, testUtils.RESOURCES_TRANSFORM_COMMAND, route.sourceFile);
				await testUtils.waitUntilEditorIsOpened(driver, route.sourceFile, 45000);
				await new Workbench().executeCommand(testUtils.TRANSFORM_ROUTE_TO_YAML_COMMAND_ID);

				await driver.wait(async function () {
					input = await InputBox.create();
					return (await input.isDisplayed());
				}, 45000);
				await input.setText(FILENAME_CREATED_FROM_CAMEL_TRANSFORM);
				await input.confirm();

				await testUtils.waitUntilEditorIsOpened(driver, FILENAME_CREATED_FROM_CAMEL_TRANSFORM, 45000);

				const tree: DefaultTreeSection = await sideBar.getContent().getSection('camel_transform_command');
				const items = await tree.getVisibleItems();

				const labels = await Promise.all(items.map(item => item.getLabel()));
				expect(labels).contains(FILENAME_CREATED_FROM_CAMEL_TRANSFORM);
			});
		});
	});
});

