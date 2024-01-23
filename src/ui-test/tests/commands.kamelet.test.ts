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
	InputBox,
	VSBrowser,
	ViewControl,
	WebDriver,
	Workbench
} from 'vscode-uitests-tooling';
import {
	activateEditor,
	deleteFile,
	getFileContent,
	killTerminal,
	waitUntilEditorIsOpened,
	waitUntilFileAvailable,
	waitUntilExtensionIsActivated,
	CREATE_COMMAND_KAMELET_YAML_ID,
	KAMELETS_RESOURCES_PATH,
	waitUntilInputBoxIsDisplayed,
} from '../utils/testUtils';
import * as pjson from '../../../package.json';

describe('Create a Kamelet using command', function () {
	this.timeout(400_000);

	let driver: WebDriver;
	let input: InputBox;
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

	const params = [
		{ kameletType: 'sink', cmd: CREATE_COMMAND_KAMELET_YAML_ID, filename: 'example', filename_ext: 'example-sink.kamelet.yaml', dsl_example: 'test-sink.yaml' },
		{ kameletType: 'source', cmd: CREATE_COMMAND_KAMELET_YAML_ID, filename: 'example', filename_ext: 'example-source.kamelet.yaml', dsl_example: 'test-source.yaml' },
		{ kameletType: 'action', cmd: CREATE_COMMAND_KAMELET_YAML_ID, filename: 'example', filename_ext: 'example-action.kamelet.yaml', dsl_example: 'test-action.yaml' },
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
				await new Workbench().executeCommand(param.cmd);

				// pick a Kamelet type
				input = await InputBox.create();
				await waitUntilInputBoxIsDisplayed(driver, input, undefined, 'Problem with Kamelet type quick pick!');
				await input.selectQuickPick(param.kameletType);

				// set file name
				input = await InputBox.create();
				await waitUntilInputBoxIsDisplayed(driver, input, 5_000, 'Problem with file name input box!');
				await input.setText(param.filename);
				await input.confirm();

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
