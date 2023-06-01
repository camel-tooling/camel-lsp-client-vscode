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
import { ActivityBar, By, DefaultTreeSection, EditorView, InputBox, Marketplace, SideBarView, TextEditor, VSBrowser, WebDriver, Workbench } from "vscode-uitests-tooling";
import { expect } from "chai";
import * as path from 'path';
import * as fs from 'fs-extra';
import * as pjson from '../../../package.json';

describe('Create a Camel Route using command', function () {
	this.timeout(400000);

	const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');

	let driver: WebDriver;
	let input: InputBox;
	let sideBar: SideBarView;

	before(async function () {
		this.timeout(200000);
		driver = VSBrowser.instance.driver;

		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		const marketplace = await Marketplace.open();
		await driver.wait(async function () {
			return await extensionIsActivated(marketplace);
		}, 150000, `The LSP extension was not activated after ${this.timeout} sec.`);
	});

	const DSL_LIST = [
		// DSL, COMMAND, FILENAME, FILENAME LONG, EXAMPLE FILE
		['XML', 'Camel: Create a Camel Route using XML DSL', 'xmlSample', 'xmlSample.camel.xml', 'XML.xml'],
		['Java', 'Camel: Create a Camel Route using Java DSL', 'Java', 'Java.java', 'Java.java'],
		['Yaml', 'Camel: Create a Camel Route using Yaml DSL', 'yamlSample', 'yamlSample.camel.yaml', 'YAML.yaml']
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
			});

			after(async function () {
				await new EditorView().closeAllEditors();
				deleteFile(FILENAME_LONG);
			});

			it('Create file', async function () {
				await new Workbench().executeCommand(COMMAND);

				await driver.wait(async function () {
					input = await InputBox.create();
					return (await input.isDisplayed());
				}, 30000);
				await input.setText(FILENAME);
				await input.confirm();

				await driver.wait(async function () {
					return (await new EditorView().getOpenEditorTitles()).find(title => title === FILENAME_LONG);
				}, 30000);
			});

			it('File available', async function () {
				const tree = await sideBar.getContent().getSection('resources') as DefaultTreeSection;
				const items = await tree.getVisibleItems();

				const labels = await Promise.all(items.map(item => item.getLabel()));
				expect(labels).contains(FILENAME_LONG);
			});

			it('Check file content', async function () {
				let editor: TextEditor;

				// workaround for https://issues.redhat.com/browse/FUSETOOLS2-2099
				await driver.wait(async function () {
					try {
						editor = await new EditorView().openEditor(FILENAME_LONG) as TextEditor;
						return true;
					} catch (err) {
						await driver.actions().click().perform();
						return false;
					}
				}, 10000, undefined, 500);

				const text = await editor.getText();
				expect(text).equals(getFileContent(EXAMPLE));
			});
		});
	});

	function getFileContent(filename: string): string {
		return fs.readFileSync(path.resolve(RESOURCES, 'camel_route_command', filename), { encoding: 'utf8', flag: 'r' });
	}

	function deleteFile(filename: string): void {
		fs.remove(path.resolve(RESOURCES, filename), (err: any) => {
			if (err) {
				return console.error(err);
			}
		});
	}

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
});
