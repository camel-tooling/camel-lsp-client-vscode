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
import path = require('path');
import { WebDriver, VSBrowser, Marketplace, By, EditorView, Workbench, InputBox, BottomBarPanel, TerminalView } from 'vscode-uitests-tooling';
import * as pjson from '../../../package.json';
import * as fs from 'fs-extra';

describe('JBang user preference version set test', function () {
    this.timeout(60000);

    let driver: WebDriver;
    let input: InputBox;
    let terminalView: TerminalView;
    let DEFAULT_JBANG: string;

    const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');

    const FILENAME = 'test.camel.xml';
    const OLDER_JBANG_VERSION = '3.20.5';

    before(async function () {
        this.timeout(200000);

        driver = VSBrowser.instance.driver;
        await VSBrowser.instance.openResources(RESOURCES);
        await VSBrowser.instance.waitForWorkbench();

        const marketplace = await Marketplace.open();
        await driver.wait(async function () {
            return await extensionIsActivated(marketplace);
        }, 150000, `The LSP extension was not activated after ${this.timeout} sec.`);

        DEFAULT_JBANG = await getJBangVersion();
    });

    after(async function () {
        await setJBangVersion(DEFAULT_JBANG);
    });

    describe('Different JBang versions', function () {
        afterEach(async function () {
            terminalView = await new BottomBarPanel().openTerminalView();
            await terminalView.selectChannel('Init Camel Route file with JBang');
            await terminalView.killTerminal();
            
            await new EditorView().closeAllEditors();
            deleteFile(FILENAME);
        });

        it('Default version', async function () {
            await setJBangVersion(DEFAULT_JBANG);

            await initFileWithJBang();

            await waitUntilTerminalHasText(driver, [`-Dcamel.jbang.version=${DEFAULT_JBANG}`]);
            expect(await (await activateTerminalView()).getText()).to.contain(`-Dcamel.jbang.version=${DEFAULT_JBANG}`);
        });

        it('Older version', async function () {
            await setJBangVersion(OLDER_JBANG_VERSION);

            await initFileWithJBang();

            await waitUntilTerminalHasText(driver, [`-Dcamel.jbang.version=${OLDER_JBANG_VERSION}`]);
            expect(await (await activateTerminalView()).getText()).to.contain(`-Dcamel.jbang.version=${OLDER_JBANG_VERSION}`);
        });
    });

    async function initFileWithJBang(): Promise<void>{
        await new Workbench().executeCommand('Camel: Create a Camel Route using XML DSL');
        await driver.wait(async function () {
            input = await InputBox.create();
            return (await input.isDisplayed());
        }, 30000);

        await input.setText('test');
        await input.confirm();

        await driver.wait(async function () {
            return (await new EditorView().getOpenEditorTitles()).find(t => t === FILENAME);
        }, 220000);
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

    async function getJBangVersion(): Promise<string> {
        const textField = await (await new Workbench().openSettings()).findSetting('JBang Version', 'Camel', 'Language Support');
        const value = await textField.getValue() as string;
        await new EditorView().closeEditor('Settings');
        return value;
    }

    async function setJBangVersion(version: string): Promise<void> {
        const textField = await (await new Workbench().openSettings()).findSetting('JBang Version', 'Camel', 'Language Support');
        await textField.setValue(version);
        await driver.sleep(500);
        await new EditorView().closeEditor('Settings');
    }

    async function waitUntilTerminalHasText(driver: WebDriver, textArray: string[], interval = 500): Promise<void> {
        await driver.wait(async function () {
            try {
                const terminal = await activateTerminalView();
                const terminalText = await terminal.getText();
                for (const text of textArray) {
                    if (!(terminalText.includes(text))) {
                        return false;
                    }
                }
                return true;
            } catch (err) {
                return false;
            }
        }, 220000, undefined, interval);
    }

    async function activateTerminalView(): Promise<TerminalView> {
        // workaround ExTester issue - https://github.com/redhat-developer/vscode-extension-tester/issues/785
        await new Workbench().executeCommand('Terminal: Focus on Terminal View');
        return await new BottomBarPanel().openTerminalView();
    }

    function deleteFile(filename: string): void {
        fs.removeSync(path.resolve(RESOURCES, filename), (err: any) => {
            if (err) {
                return console.error(err);
            }
        });
    }
});
