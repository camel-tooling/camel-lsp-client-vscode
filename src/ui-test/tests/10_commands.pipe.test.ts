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
} from 'vscode-extension-tester';
import {
	activateEditor,
	deleteFile,
	getFileContent,
	killTerminal,
	waitUntilEditorIsOpened,
	waitUntilFileAvailable,
	waitUntilExtensionIsActivated,
	initNewCamelFile,
	RESOURCES
} from '../utils/testUtils';
import * as pjson from '../../../package.json';

describe('Create a Pipe using command', function () {
	this.timeout(400_000);

	let driver: WebDriver;
	let control: ViewControl;

	before(async function () {
		this.timeout(200_000);
		driver = VSBrowser.instance.driver;
		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
		control = await new ActivityBar().getViewControl('Explorer') as ViewControl;
		await control.openView();
	});

	const fileName: string = 'example';
	const fileNameExt: string = `${fileName}-pipe.yaml`;

	describe('YAML DSL', function () {

		before(async function () {
			await control.openView();
			await deleteFile(fileNameExt, RESOURCES);
		});

		after(async function () {
			await new EditorView().closeAllEditors();
			await killTerminal();
			await deleteFile(fileNameExt, RESOURCES);
		});

		it('Create file', async function () {
			await initNewCamelFile('Pipe', fileName);
			await waitUntilFileAvailable(driver, fileNameExt, 'resources', 60_000);
		});

		it('Editor opened', async function () {
			await waitUntilEditorIsOpened(driver, fileNameExt);
		});

		it('Check file content', async function () {
			const editor = await activateEditor(driver, fileNameExt);
			const text = await editor.getText();
			expect(text).deep.equals(getFileContent('camel-example-pipe.yaml', RESOURCES));
		});
	});
});
