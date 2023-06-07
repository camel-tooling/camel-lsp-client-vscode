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
import { ActivityBar, By, DefaultTreeSection, EditorView, InputBox, Marketplace, SideBarView, VSBrowser, WebDriver, Workbench } from "vscode-uitests-tooling";
import * as fs from 'fs';
import * as path from 'path';
import * as pjson from '../../../package.json';

describe('Create a Camel Project using command', function () {
	this.timeout(400000);

	const SPECIFIC_WORKSPACE: string = path.resolve('src', 'ui-test', 'resources', 'create-camel-project-workspace');

	let driver: WebDriver;
	let input: InputBox;
	let sideBar: SideBarView;

	before(async function () {
		this.timeout(200000);
		driver = VSBrowser.instance.driver;

		fs.mkdirSync(SPECIFIC_WORKSPACE, {recursive: true});

		await VSBrowser.instance.openResources(SPECIFIC_WORKSPACE);
		await VSBrowser.instance.waitForWorkbench();

		const marketplace = await Marketplace.open();
		await driver.wait(async function () {
			return await extensionIsActivated(marketplace);
		}, 150000, `The LSP extension was not activated after ${this.timeout} sec.`);
	});

	before(async function () {
		sideBar = await (await new ActivityBar().getViewControl('Explorer'))?.openView();
	});

	after(async function () {
		await new EditorView().closeAllEditors();
		fs.rmSync(SPECIFIC_WORKSPACE, {recursive: true});
	});

	it('Create Project', async function () {
		await new Workbench().executeCommand('camel.jbang.project.quarkus.new');

		await driver.wait(async function () {
			input = await InputBox.create();
			return (await input.isDisplayed());
		}, 30000);
		await input.setText('com.demo:test:1.0-SNAPSHOT');
		await input.confirm();

		const tree = await sideBar.getContent().getSection('create-camel-project-workspace') as DefaultTreeSection;
		await driver.wait(async () => {
			const items = await tree.getVisibleItems();

			const labels = await Promise.all(items.map(item => item.getLabel()));
			return labels.includes('pom.xml');
		}, 30000);
	});
});

async function extensionIsActivated(marketplace: Marketplace): Promise<boolean> {
	try {
		const item = await marketplace.findExtension(`@installed ${pjson.displayName}`);
		const activationTime = await item.findElement(By.className('activationTime'));
		if (activationTime !== undefined) {
			return true;
		} else {
			return false;
		}
	} catch (err) {
		return false;
	}
}
