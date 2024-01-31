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
	EXAMPLE_COMMAND_JAVA_FILE,
	EXAMPLE_COMMAND_XML_FILE,
	EXAMPLE_COMMAND_YAML_FILE,
	deleteFile,
	getFileContent,
	killTerminal,
	RESOURCES,
	waitUntilEditorIsOpened,
	waitUntilFileAvailable,
	waitUntilExtensionIsActivated,
	RESOURCES_COMMAND,
	initNewCamelFile,
} from '../utils/testUtils';
import * as pjson from '../../../package.json';

describe('Create a Camel Route using command', function () {
	this.timeout(400000);

	let driver: WebDriver;
	let control: ViewControl;

	before(async function () {
		this.timeout(200000);
		driver = VSBrowser.instance.driver;
		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
		control = await new ActivityBar().getViewControl('Explorer');
		await control.openView();
	});

	const params = [
		{ dsl: 'XML', filename: 'xmlSample', filename_ext: 'xmlSample.camel.xml', dsl_example: EXAMPLE_COMMAND_XML_FILE },
		{ dsl: 'Java', filename: 'Java', filename_ext: 'Java.java', dsl_example: EXAMPLE_COMMAND_JAVA_FILE },
		{ dsl: 'YAML', filename: 'yamlSample', filename_ext: 'yamlSample.camel.yaml', dsl_example: EXAMPLE_COMMAND_YAML_FILE }
	];

	params.forEach(function (param) {
		describe(`${param.dsl} DSL`, function () {

			before(async function () {
				await control.openView();
				await deleteFile(param.filename_ext, RESOURCES);
			});

			after(async function () {
				await new EditorView().closeAllEditors();
				await killTerminal();
				await deleteFile(param.filename_ext, RESOURCES);
			});

			it('Create file', async function () {
				await initNewCamelFile(`${param.dsl} DSL`, param.filename);
				await waitUntilFileAvailable(driver, param.filename_ext, undefined, 60000);
			});

			it('Editor opened', async function () {
				await waitUntilEditorIsOpened(driver, param.filename_ext);
			});

			it('Check file content', async function () {
				const editor = await activateEditor(driver, param.filename_ext);
				const text = await editor.getText();
				expect(text).deep.equals(getFileContent(param.dsl_example, RESOURCES_COMMAND));
			});
		});

	});
});
