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

import { WebDriver, SideBarView, VSBrowser, ActivityBar, EditorView, InputBox, DefaultTreeSection } from "vscode-uitests-tooling";
import { RESOURCES, waitUntilExtensionIsActivated, deleteFile, killTerminal, waitUntilEditorIsOpened, initNewCamelFile } from "../utils/testUtils";
import * as pjson from '../../../package.json';
import { expect } from "chai";

describe('Create a Camel Route using command', function () {
	this.timeout(400000);

	const FILENAME_ROUTE_CREATED_FROM_OPENAPI: string = 'route-created-from-open-api';

	let driver: WebDriver;
	let input: InputBox;
	let sideBar: SideBarView;

	before(async function () {
		this.timeout(200000);
		driver = VSBrowser.instance.driver;

		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
	});

	before(async function () {
		sideBar = await (await new ActivityBar().getViewControl('Explorer'))?.openView();
	});

	after(async function () {
		await new EditorView().closeAllEditors();
		await killTerminal();
		await deleteFile(FILENAME_ROUTE_CREATED_FROM_OPENAPI + '.camel.yaml', RESOURCES);
	});

	it(`OpenAPI`, async function () {
		await initNewCamelFile('YAML DSL from OpenAPI', FILENAME_ROUTE_CREATED_FROM_OPENAPI);
		await driver.wait(async function () {
			input = await InputBox.create();
			return (await input.isDisplayed());
		}, 30000);
		await input.setText((await input.getText()) + '/petstore.json');
		await input.confirm();

		await waitUntilEditorIsOpened(driver, FILENAME_ROUTE_CREATED_FROM_OPENAPI + '.camel.yaml', 30000);

		const tree: DefaultTreeSection = await sideBar.getContent().getSection('resources');
		const items = await tree.getVisibleItems();

		const labels = await Promise.all(items.map(item => item.getLabel()));
		expect(labels).contains(FILENAME_ROUTE_CREATED_FROM_OPENAPI + '.camel.yaml');
	});
});
