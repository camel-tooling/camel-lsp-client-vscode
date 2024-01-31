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
import {
	ActivityBar,
	EditorView,
	VSBrowser,
	ViewControl,
	WebDriver
} from 'vscode-uitests-tooling';
import {
	activateEditor,
	deleteFile,
	getFileContent,
	killTerminal,
	waitUntilEditorIsOpened,
	waitUntilFileAvailable,
	waitUntilExtensionIsActivated,
	KAMELETS_RESOURCES_PATH,
	initNewCamelFile
} from '../utils/testUtils';
import * as pjson from '../../../package.json';

describe('Create a Kamelet using command', function () {
	this.timeout(400_000);

	let driver: WebDriver;
	let control: ViewControl;

	before(async function () {
		this.timeout(200_000);
		driver = VSBrowser.instance.driver;
		await VSBrowser.instance.openResources(KAMELETS_RESOURCES_PATH);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
		control = await new ActivityBar().getViewControl('Explorer');
		await control.openView();
	});

	const fileName: string = 'example';
	const params = [
		{ kameletType: 'sink', filename_ext: `${fileName}-sink.kamelet.yaml`, dsl_example: 'test-sink.yaml' },
		{ kameletType: 'source', filename_ext: `${fileName}-source.kamelet.yaml`, dsl_example: 'test-source.yaml' },
		{ kameletType: 'action', filename_ext: `${fileName}-action.kamelet.yaml`, dsl_example: 'test-action.yaml' }
	];

	params.forEach(function (param) {
		describe(`${param.kameletType}`, function () {

			before(async function () {
				await control.openView();
				await deleteFile(param.filename_ext, KAMELETS_RESOURCES_PATH);
			});

			after(async function () {
				await new EditorView().closeAllEditors();
				await killTerminal();
				await deleteFile(param.filename_ext, KAMELETS_RESOURCES_PATH);
			});

			it('Create file', async function () {
				await initNewCamelFile('Kamelet', fileName, param.kameletType);
				await waitUntilFileAvailable(driver, param.filename_ext, 'kamelets', 60_000);
			});

			it('Editor opened', async function () {
				await waitUntilEditorIsOpened(driver, param.filename_ext);
			});

			it('Check file content', async function () {
				const editor = await activateEditor(driver, param.filename_ext);
				const text = await editor.getText();
				expect(text).deep.equals(getFileContent(param.dsl_example, KAMELETS_RESOURCES_PATH));
			});
		});

	});
});
