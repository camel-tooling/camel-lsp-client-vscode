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

import {
	ActivityBar,
	BottomBarPanel,
	By,
	ComboSetting,
	ContentAssistItem,
	DefaultTreeSection,
	EditorView,
	InputBox,
	Marketplace,
	ModalDialog,
	ProblemsView,
	SideBarView,
	TerminalView,
	TextEditor,
	TextSetting,
	VSBrowser,
	WebDriver,
	Workbench
} from "vscode-uitests-tooling";
import { storageFolder } from "../uitest_runner";
import * as path from 'path';
import * as fs from 'fs-extra';

// Resources and file names inside.
export const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');
export const CAMEL_CONTEXT_JAVA = 'camel-context.java';
export const CAMEL_CONTEXT_XML = 'camel-context.xml';
export const CAMEL_CONTEXT_YAML = 'camel-context.yaml';
export const CAMEL_ROUTE_XML = 'camel-route.xml';
export const CODE_NAVIGATION_JAVA = 'codeNavigation.java';
export const CODE_NAVIGATION_XML = 'code-navigation.xml';

export const XML_URI_LINE = 3; //camel-context.xml
export const XML_URI_POSITION = 33; //camel-context.xml

export const JAVA_URI_LINE = 9; //camel-context.java
export const JAVA_URI_POSITION = 15; //camel-context.java

export const YAML_URI_LINE = 7; //camel-context.yaml
export const YAML_URI_POSITION = 14; //camel-context.yaml

// Camel-K
export const GROOVY_TESTFILE = 'test.camelk.groovy'; 
export const KOTLIN_TESTFILE = 'test.camelk.kts';
export const JS_TESTFILE = 'camel.js'; 

export const GROOVY_URI_LINE = 1; // test.camelk.groovy
export const GROOVY_URI_POSITION = 7; // test.camelk.groovy

export const KOTLIN_URI_LINE = 1; // test.camelk.kts
export const KOTLIN_URI_POSITION = 7; // test.camelk.kts

export const JS_URI_LINE = 3; // camel.js
export const JS_URI_POSITION = 7; // camel.js

// Commands for creating Camel Routes.
export const CREATE_COMMAND_XML = 'camel.jbang.routes.xml';
export const CREATE_COMMAND_YAML = 'camel.jbang.routes.yaml';
export const CREATE_COMMAND_JAVA = 'camel.jbang.routes.java';
export const CREATE_COMMAND_QUARKUS = 'camel.jbang.project.quarkus.new';
export const CREATE_COMMAND_SPRINGBOOT = 'camel.jbang.project.springboot.new';

// Resources for component reference testing.
export const RESOURCES_REFERENCES: string = path.resolve(RESOURCES, 'component_references');
export const REFERENCES_FILE_1 = 'camel1.xml';
export const REFERENCES_FILE_2 = 'camel2.xml';

// Resources for Camel route commands testing.
export const RESOURCES_COMMAND: string = path.resolve(RESOURCES, 'camel_route_command');
export const COMMAND_JAVA_FILE = 'Java.java';
export const COMMAND_XML_FILE = 'XML.xml';
export const COMMAND_YAML_FILE = 'YAML.yaml';

// Identifiers of user preferences inside settings.json.
export const JBANG_VERSION_ID = 'camel.languageSupport.JBangVersion';
export const CATALOG_PROVIDER_ID = 'camel.Camel catalog runtime provider';
export const CATALOG_VERSION_ID = 'camel.Camel catalog version';
export const EXTRA_COMPONENTS_ID = 'camel.extra-components';

export const JBANG_VERSION_UI = 'JBang Version';
export const CATALOG_PROVIDER_UI = 'Camel catalog runtime provider';
export const CATALOG_VERSION_UI = 'Camel catalog version';

// Specific workspace for creating project with command.
export const SPECIFIC_WORKSPACE: string = path.resolve(RESOURCES, 'create-camel-project-workspace');

// Other constant items
export const LSP_STATUS_BAR_MESSAGE = 'Camel LS';

/**
 * Workaround for issue with ContentAssistItem getText() method.
 * For more details please see https://issues.redhat.com/browse/FUSETOOLS2-284
 *
 * @param item ContenAssistItem
 */
export async function getTextExt(item: ContentAssistItem): Promise<string> {
	const name: string = await item.getText();
	return name.split('\n')[0];
}

/**
 * Workaround the issue of BottomBarPanel().openProblemsView() method.
 *
 * For more details see https://github.com/redhat-developer/vscode-extension-tester/issues/505
 */
export async function openProblemsView(): Promise<ProblemsView> {
	const workbench = new Workbench();
	await workbench.executeCommand('View: Open View');
	await workbench.openCommandPrompt();
	const input = await InputBox.create();
	await input.setText('view Problems');
	await input.confirm();
	return new ProblemsView();
}

/**
 * Close editor with handling of Save/Don't Save Modal dialog.
 *
 * @param title Title of opened active editor.
 * @param save true/false
 */
export async function closeEditor(title: string, save?: boolean) {
	const dirty = await new TextEditor().isDirty();
	await new EditorView().closeEditor(title);
	if (dirty) {
		const dialog = new ModalDialog();
		if (save) {
			await dialog.pushButton('Save');
		} else {
			await dialog.pushButton('Don\'t Save');
		}
	}
}

/**
 * Switch to an editor tab with the given title.
 *
 * @param title Title of editor to activate
 */
export async function activateEditor(driver: WebDriver, title: string): Promise<TextEditor> {
	// workaround for https://issues.redhat.com/browse/FUSETOOLS2-2099
	let editor: TextEditor;
	await driver.wait(async function () {
		try {
			editor = await new EditorView().openEditor(title) as TextEditor;
			return true;
		} catch (err) {
			await driver.actions().click().perform();
			return false;
		}
	}, 10000, undefined, 500);
	return editor;
}

/**
 * Reset user setting to default value by deleting item in settings.json.
 *
 * @param id ID of setting to reset.
 */
export function resetUserSettings(id: string): void {
	const settingsPath = path.resolve(storageFolder, 'settings', 'User', 'settings.json');
	const reset = fs.readFileSync(settingsPath, 'utf-8').replace(new RegExp(`"${id}.*`), '').replace(/,(?=[^,]*$)/, '');
	fs.writeFileSync(settingsPath, reset, 'utf-8');
}

/**
 * Delete file from folder.
 *
 * @param filename Name of file.
 * @param folder Folder with file to delete.
 */
export async function deleteFile(filename: string, folder: string): Promise<void> {
	try {
		await fs.remove(path.resolve(folder, filename));
	} catch (err) {
		console.error(err)
	}
}

/**
 * Wait until editor is opened.
 *
 * @param driver WebDriver.
 * @param title Title of editor - filename.
 * @param timeout Timeout for dynamic wait.
 */
export async function waitUntilEditorIsOpened(driver: WebDriver, title: string, timeout = 10000): Promise<void> {
	await driver.wait(async function () {
		return (await new EditorView().getOpenEditorTitles()).find(t => t === title);
	}, timeout);
}

/**
 * Wait until terminal has text.
 *
 * @param driver WebDriver.
 * @param text Text to be contained in terminal.
 * @param timeout Timeout for dynamic wait.
 * @param interval Delay between individual checks.
 */
export async function waitUntilTerminalHasText(driver: WebDriver, text: string, timeout = 120000, interval = 500): Promise<void> {
	await driver.wait(async function () {
		try {
			const terminal = await activateTerminalView();
			const terminalText = await terminal.getText();
			return terminalText.includes(text);
		} catch (err) {
			return false;
		}
	}, timeout, undefined, interval);
}

/**
 * Activate terminal view.
 *
 * @returns Opened TerminalView.
 */
export async function activateTerminalView(): Promise<TerminalView> {
	await new Workbench().executeCommand('Terminal: Focus on Terminal View');
	await new BottomBarPanel().toggle(true);
	return await new BottomBarPanel().openTerminalView();
}

/**
 * Kill activate terminal.
 */
export async function killTerminal(): Promise<void> {
	await (await activateTerminalView()).killTerminal();
}

/**
 * Kill specific terminal.
 *
 * @param channelName Name of channel to be killed.
 */
export async function killTerminalChannel(channelName: string): Promise<void> {
	const terminalView = await activateTerminalView();
	await terminalView.selectChannel(channelName);
	await terminalView.killTerminal();
}

/**
 * Wait until required extension is activated.
 *
 * @param driver WebDriver.
 * @param displayName Name of extension.
 * @param timeout Timeout for dynamic wait.
 * @param interval Delay between individual checks.
 */
export async function waitUntilExtensionIsActivated(driver: WebDriver, displayName: string, timeout = 150000, interval = 500): Promise<void> {
	await driver.wait(async function () {
		return await extensionIsActivated(displayName);
	}, timeout, `The LSP extension was not activated after ${timeout} sec.`, interval);
}

/**
 * Checks, if extension is activated.
 *
 * @param displayName Name of extension.
 * @returns true/false
 */
export async function extensionIsActivated(displayName: string): Promise<boolean> {
	try {
		const item = await (await Marketplace.open()).findExtension(`@installed ${displayName}`);
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

/**
 * Get content of specific file.
 *
 * @param filename Name of file.
 * @param folder Folder with file.
 * @returns File content as string.
 */
export function getFileContent(filename: string, folder: string): string {
	return fs.readFileSync(path.resolve(folder, 'camel_route_command', filename), { encoding: 'utf8', flag: 'r' });
}

/**
 * Init XML file using JBang.
 *
 * @param driver WebDriver.
 * @param filename Name of initialized file.
 */
export async function initXMLFileWithJBang(driver: WebDriver, filename: string): Promise<void> {
	let input: InputBox;
	await new Workbench().executeCommand(CREATE_COMMAND_XML);
	await driver.wait(async function () {
		input = await InputBox.create();
		return (await input.isDisplayed());
	}, 30000);
	await input.setText(filename);
	await input.confirm();
	await waitUntilFileAvailable(driver, filename.concat('.camel.xml'), 30000);
	await waitUntilEditorIsOpened(driver, filename.concat('.camel.xml'), 30000);
}

/**
 * Change 'JBang Version' value in preferences.
 *
 * @param version Required version.
 */
export async function setJBangVersion(version: string): Promise<void> {
	const settings = await new Workbench().openSettings();
	const textSetting = await settings.findSetting(JBANG_VERSION_UI, 'Camel', 'Language Support') as TextSetting;
	await textSetting.setValue(version);
	await closeEditor('Settings', true);
}

/**
 * Change 'Camel catalog runtime provider' value in preferences.
 *
 * @param provider Required provider.
 */
export async function setRuntimeProvider(provider: string): Promise<void> {
	const settings = await new Workbench().openSettings();
	const comboSetting = await settings.findSetting(CATALOG_PROVIDER_UI, 'Camel') as ComboSetting;
	await comboSetting.setValue(provider);
	await closeEditor('Settings', true);
}

/**
 * Change 'Camel catalog version' value in preferences.
 *
 * @param version Required version.
 */
export async function setCamelCatalogVersion(version: string): Promise<void> {
	const settings = await new Workbench().openSettings();
	const textSetting = await settings.findSetting(CATALOG_VERSION_UI, 'Camel') as TextSetting;
	await textSetting.setValue(version);
	await closeEditor('Settings', true);
}

/**
 * Set 'Extra-components' in preferences.
 * @param components 'Extra components' as string respecting Camel Catalog syntax.
 */
export async function setAdditionalComponents(components: string): Promise<void> {
	resetUserSettings(EXTRA_COMPONENTS_ID); // Remove previous value.
	const settingsPath = path.resolve(storageFolder, 'settings', 'User', 'settings.json');
	const newSettings = fs.readFileSync(settingsPath, 'utf-8').slice(0, -2).concat(',', components).concat('}'); // Remove '}', add ',' then additional components and give back '}'.
	fs.writeFileSync(settingsPath, newSettings, 'utf-8');
}

/**
 * Get current value of 'JBang Version' from preferences.
 *
 * @returns 'JBang Version' value as string.
 */
export async function getJBangVersion(): Promise<string> {
	const setting = await (await new Workbench().openSettings()).findSetting(JBANG_VERSION_UI, 'Camel', 'Language Support');
	const value = await setting.getValue() as string;
	await new EditorView().closeEditor('Settings');
	return value;
}

/**
 * Get current value of 'Camel catalog runtime provider' from preferences.
 *
 * @returns 'Camel catalog runtime provider' value as string.
 */
export async function getRuntimeProvider(): Promise<string> {
	const setting = await (await new Workbench().openSettings()).findSetting(CATALOG_PROVIDER_UI, 'Camel');
	const value = await setting.getValue() as string;
	await new EditorView().closeEditor('Settings');
	return value;
}

/**
 * Get current value of 'Camel catalog version' from preferences.
 *
 * @returns 'Camel catalog version' value as string.
 */
export async function getCamelCatalogVersion(): Promise<string> {
	const setting = await (await new Workbench().openSettings()).findSetting(CATALOG_VERSION_UI, 'Camel');
	const value = await setting.getValue() as string;
	await new EditorView().closeEditor('Settings');
	return value;
}

/**
 * Creates file with required name.
 *
 * @param driver WebDriver.
 * @param name Required name for new file including suffix.
 */
export async function createNewFile(driver: WebDriver, name: string): Promise<void> {
	let input: InputBox;
	await new Workbench().executeCommand('Create: New File...');
    await driver.wait(async function () {
            input = await InputBox.create();
            return (await input.isDisplayed());
    }, 30000);
    await input.setText(name);
    await input.confirm(); // confirm name
    await input.confirm(); // confirm path
}

/** Opens file in editor.
 *
 * @param driver WebDriver.
 * @param folder Folder with file.
 * @param file Filename.
 * @returns Instance of Text Editor.
 */
export async function openFileInEditor(driver: WebDriver, folder: string, file: string): Promise<TextEditor> {
	await VSBrowser.instance.openResources(path.join(folder, file));
	await waitUntilEditorIsOpened(driver, file);
	return (await activateEditor(driver, file));
}

/**
 * Checks, if References in Side Bar is available (contains at least one reference).
 *
 * @returns true/false
 */
export async function isReferencesAvailable(): Promise<boolean> {
	try {
		const section = await new SideBarView().getContent().getSection('References') as DefaultTreeSection;
		await section.click();
		const visibelItems = await section.getVisibleItems();
		return(visibelItems.length > 0); // at least one item is available
	} catch (err) {
		return false;
	}
}

/**
 * Clear all available references in 'References' Side Bar.
 */
export async function clearReferences(): Promise<void> {
	try {
		const section = await new SideBarView().getContent().getSection('References') as DefaultTreeSection;
		await section.click();
		await new Workbench().executeCommand('references-view.clear'); // clear current if available - must be done
		await new Workbench().executeCommand('references-view.clearHistory'); // clear history
	}
	catch (err) {
		console.error(err); // if 'References' Side Bar is not opened
	}
}

/**
 * Checks, if file is available in Explorer. 
 * 
 * @param filename Filename.
 * @returns true/false
 */
export async function fileIsAvailable(filename: string): Promise<boolean> {
	const sideBar = await (await new ActivityBar().getViewControl('Explorer'))?.openView();
	const tree = await sideBar.getContent().getSection('resources') as DefaultTreeSection;
	const items = await tree.getVisibleItems();
	const labels = await Promise.all(items.map(item => item.getLabel()));
	return labels.includes(filename);
}

/**
 * Waits until file is available in Explorer.
 * 
 * @param driver WebDriver.
 * @param filename Filename.
 * @param timeout Timeout for dynamic wait.
 * @param interval Delay between individual checks.
 */
export async function waitUntilFileAvailable(driver: WebDriver, filename: string, timeout = 30000, interval = 500): Promise<void> {
	await driver.wait(async function () {
		try {
			return await fileIsAvailable(filename);
		} catch (err) {
			return false;
		}
	}, timeout, undefined, interval);
}
