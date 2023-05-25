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

import { assert } from 'chai';
import { Workbench, VSBrowser, TextSetting, TextEditor, ContentAssist } from 'vscode-uitests-tooling';
import * as path from 'path';
import * as utils from '../utils/testUtils';
import * as fs from 'node:fs';

describe('Camel catalog user preference version set test', function () {
    this.timeout(60000);

    let contentAssist: ContentAssist;

    const RESOURCES = path.resolve('src', 'ui-test', 'resources');
    const CAMEL_CONTEXT_XML = 'camel-context.xml';
    const URI_POSITION = 33;

    before(async function () {
        this.timeout(20000);
        await VSBrowser.instance.waitForWorkbench();
    });

    // reset version to default
    async function _setDefaultCamelCatalogVersion() {
        resetUserSettings('camel.Camel catalog version');
    }

    describe('Different catalog versions', function () {

        after(_setDefaultCamelCatalogVersion);

        it('Default version', async function () {
            // open file
            await VSBrowser.instance.openResources(path.join(RESOURCES, CAMEL_CONTEXT_XML));

            // add component
            const editor = new TextEditor();
            await editor.isDisplayed();
            await editor.typeTextAt(3, URI_POSITION, 'file-watch');

            // open ca
            contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
            const items = await contentAssist.getItems();
            // should be 1
            assert.equal(items.length, 1);

            // check if content is expected
            const expectedContentAssist = 'file-watch:path';
            const timer = await contentAssist.getItem(expectedContentAssist);
            assert.equal(await utils.getTextExt(timer), expectedContentAssist);

            // close file w\o saving
            await utils.closeEditor(CAMEL_CONTEXT_XML, false);
        });

        it('2.15.1 version', async function () {
            // set version
            await setCamelCatalogVersion('2.15.1');

            // open file
            await VSBrowser.instance.openResources(path.join(RESOURCES, CAMEL_CONTEXT_XML));

            // add component
            const editor = new TextEditor();
            await editor.isDisplayed();
            await editor.typeTextAt(3, URI_POSITION, 'file-watch');

            // open ca
            contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
            const items = await contentAssist.getItems();
            // should be empty
            assert.equal(items.length, 0);

            // close file w\o saving
            await utils.closeEditor(CAMEL_CONTEXT_XML, false);
        });

    });

    async function setCamelCatalogVersion(version: string): Promise<void> {
        const settings = await new Workbench().openSettings();
        const textField = await settings.findSetting('Camel catalog version', 'Camel') as TextSetting;
        await textField.setValue(version);
        await utils.closeEditor('Settings', true);
    }

    function resetUserSettings(id: string) {
        const settingsPath = path.resolve('test-resources', 'settings', 'User', 'settings.json');
        const reset = fs.readFileSync(settingsPath, 'utf-8').replace(new RegExp(`"${id}.*`), '').replace(/,(?=[^,]*$)/, '');
        fs.writeFileSync(settingsPath, reset, 'utf-8');
    }
});
