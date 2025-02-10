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

import * as fs from 'node:fs';
import path from 'path';
import {
	ActivityBar,
	CustomTreeSection,
	EditorView,
	InputBox,
	ViewContent,
	ViewControl,
	VSBrowser,
	WebDriver,
	WelcomeContentButton,
	WelcomeContentSection
} from 'vscode-extension-tester';
import * as pjson from '../../../package.json';
import {
	killTerminal,
	SPECIFIC_WORKSPACE_PATH,
	TASK_FINISHED_IN_TERMINAL_TEXT,
	waitUntilExtensionIsActivated,
	waitUntilFileAvailable,
	waitUntilTerminalHasText
} from '../utils/testUtils';

describe('Create a Camel Project using welcome content button', function () {
	this.timeout(600000);
	const WELCOME_CONTENT_BUTTON_WORKSPACE_PATH = path.join(SPECIFIC_WORKSPACE_PATH, 'using-welcome-content-button');
	const WELCOME_CONTENT_BUTTON_WORKSPACE_NAME: string = 'using-welcome-content-button';
	const CREATE_PROJECT_BUTTON = 'Create a Camel project';
	const NO_FOLDER_OPENED_SECTION = 'No Folder Opened';
	let driver: WebDriver;
	let section: CustomTreeSection;
	let content: ViewContent;
	let input: InputBox;

	before(async function () {
		driver = VSBrowser.instance.driver;
		fs.mkdirSync(WELCOME_CONTENT_BUTTON_WORKSPACE_PATH, { recursive: true });
		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
		const view = await ((await new ActivityBar().getViewControl('Explorer')) as ViewControl).openView();
		content = view.getContent();
		section = await content.getSection(NO_FOLDER_OPENED_SECTION);
	});

	after(async function () {
		await ((await new ActivityBar().getViewControl('Explorer')) as ViewControl).closeView();
		await new EditorView().closeAllEditors();
		await killTerminal();
	});

	it(`Using button in section '${NO_FOLDER_OPENED_SECTION}'`, async function () {
		const buttons = await ((await section.findWelcomeContent()) as WelcomeContentSection).getButtons();
		const welcomeContentButton = await findButtonByTitle(buttons, CREATE_PROJECT_BUTTON);
		await welcomeContentButton?.click();

		input = await InputBox.create(30000);
		await input.setText('quarkus');
		await input.confirm();

		input = await InputBox.create(30000);
		await input.setText('com.demo:test:1.0-SNAPSHOT');
		await input.confirm();

		input = await InputBox.create(30000);
		await input.setText(WELCOME_CONTENT_BUTTON_WORKSPACE_PATH);
		await input.confirm();

		await waitUntilTerminalHasText(driver, TASK_FINISHED_IN_TERMINAL_TEXT);
		await VSBrowser.instance.openResources(WELCOME_CONTENT_BUTTON_WORKSPACE_PATH);
		await VSBrowser.instance.waitForWorkbench();
		await waitUntilFileAvailable(driver, 'pom.xml', WELCOME_CONTENT_BUTTON_WORKSPACE_NAME, 60000);
		await driver.sleep(1000);
	});
});

async function findButtonByTitle(buttons: WelcomeContentButton[], title: string): Promise<WelcomeContentButton | undefined> {
    for (const button of buttons) {
        if (await button.getTitle() === title) {
            return button;
        }
    }
    return undefined;
}
