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

import * as path from 'path';
import { assert, expect } from 'chai';
import {
    activateTerminalView,
    CAMEL_CONTEXT_XML,
    CATALOG_PROVIDER_ID,
    CATALOG_VERSION_ID,
    closeEditor,
    deleteFile,
    getJBangVersion,
    getTextExt,
    initXMLFileWithJBang,
    killTerminalChannel,
    resetUserSettings,
    RESOURCES,
    setCamelCatalogVersion,
    setJBangVersion,
    setRuntimeProvider,
    waitUntilEditorIsOpened,
    waitUntilExtensionIsActivated,
    waitUntilTerminalHasText,
    XML_URI_POSITION
} from '../utils/testUtils';
import * as pjson from '../../../package.json';
import {
    ActivityBar,
    ContentAssist,
    EditorView,
    TextEditor,
    VSBrowser,
    WebDriver
} from 'vscode-uitests-tooling';

let driver: WebDriver;
let contentAssist: ContentAssist;

describe('User preferences', function () {

    const _setup = function () {
        return async function () {
            this.timeout(40000);
            driver = VSBrowser.instance.driver;
            await VSBrowser.instance.openResources(RESOURCES);
            await VSBrowser.instance.waitForWorkbench();
            await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
            await (await new ActivityBar().getViewControl('Explorer')).openView();
        }
    };

    describe('Camel Runtime Provider', function () {
        this.timeout(90000);

        const KNATIVE = 'knative';
        const MONGO = 'mongo';
        const JMX = 'jmx';

        const KNATIVE_PROP = 'knative:type/typeId';
        const MONGO_PROP = 'mongodb:connectionBean';
        const JMX_PROP = 'jmx:serverURL';

        before(_setup());

        after(function () {
            resetUserSettings(CATALOG_PROVIDER_ID);
        });

        const PROVIDERS_LIST = [
            // runtime provider, knative available, mongo available, jmx available
            ['SPRINGBOOT', true, true, true],
            ['QUARKUS', true, true, false],
            ['KARAF', false, true, true]
        ];

        PROVIDERS_LIST.forEach(function (provider) {
            const PROVIDER = provider.at(0).toString();
            const KNATIVE_AV = Boolean(provider.at(1));
            const MONGO_AV = Boolean(provider.at(2));
            const JMX_AV = Boolean(provider.at(3));

            describe(`${PROVIDER}`, function () {

                before(async function () {
                    await setRuntimeProvider(PROVIDER);
                });

                beforeEach(async function () {
                    await VSBrowser.instance.openResources(path.join(RESOURCES, CAMEL_CONTEXT_XML));
                    await waitUntilEditorIsOpened(driver, CAMEL_CONTEXT_XML);
                });

                afterEach(async function () {
                    await closeEditor(CAMEL_CONTEXT_XML, false);
                });

                it('Knative component', async function () {
                    await testComponent(KNATIVE, KNATIVE_PROP, KNATIVE_AV, 1);
                });

                it('Mongo component', async function () {
                    await testComponent(MONGO, MONGO_PROP, MONGO_AV, 2);
                });

                it('JMX component', async function () {
                    await testComponent(JMX, JMX_PROP, JMX_AV, 1);
                });
            });
        });

        /**
         * Checks if component proposal is available. 
         * 
         * @param component Component to be tested.
         * @param proposal Tested proposal for component.
         * @param proposalAvailable Should be proposal available.
         * @param proposalsCount Number of available proposals.
         */
        async function testComponent(component: string, proposal: string, proposalAvailable: boolean, proposalsCount: number): Promise<void> {
            const editor = new TextEditor();
            await editor.typeTextAt(3, XML_URI_POSITION, component);

            contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
            const items = await contentAssist.getItems();

            if (proposalAvailable) {
                assert.equal(items.length, proposalsCount);
                const proposalItem = await contentAssist.getItem(proposal);
                assert.equal(await getTextExt(proposalItem), proposal);
            } else {
                assert.equal(items.length, 0);
            }
        }
    });

    describe('Camel Catalog version', function () {
        this.timeout(90000);

        before(_setup());
        after(_setDefaultCamelCatalogVersion);

        // reset version to default
        async function _setDefaultCamelCatalogVersion() {
            resetUserSettings(CATALOG_VERSION_ID);
        }

        it('Default version', async function () {
            // open file
            await VSBrowser.instance.openResources(path.join(RESOURCES, CAMEL_CONTEXT_XML));

            // add component
            const editor = new TextEditor();
            await editor.isDisplayed();
            await editor.typeTextAt(3, XML_URI_POSITION, 'file-watch');

            // open ca
            contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
            const items = await contentAssist.getItems();
            // should be 1
            assert.equal(items.length, 1);

            // check if content is expected
            const expectedContentAssist = 'file-watch:path';
            const timer = await contentAssist.getItem(expectedContentAssist);
            assert.equal(await getTextExt(timer), expectedContentAssist);

            // close file w\o saving
            await closeEditor(CAMEL_CONTEXT_XML, false);
        });

        it('2.15.1 version', async function () {
            // set version
            await setCamelCatalogVersion('2.15.1');

            // open file
            await VSBrowser.instance.openResources(path.join(RESOURCES, CAMEL_CONTEXT_XML));

            // add component
            const editor = new TextEditor();
            await editor.isDisplayed();
            await editor.typeTextAt(3, XML_URI_POSITION, 'file-watch');

            // open ca
            contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
            const items = await contentAssist.getItems();
            // should be empty
            assert.equal(items.length, 0);

            // close file w\o saving
            await closeEditor(CAMEL_CONTEXT_XML, false);
        });
    });

    describe('JBang version', function () {
        this.timeout(90000);

        let DEFAULT_JBANG: string;

        const FILENAME = 'test'; // without '.camel.xml' suffix
        const OLDER_JBANG_VERSION = '3.20.5';

        before(async function () {
            _setup();
            deleteFile(FILENAME.concat('.camel.xml'), RESOURCES); // prevent failure 
            DEFAULT_JBANG = await getJBangVersion();
        });

        after(async function () {
            await setJBangVersion(DEFAULT_JBANG);
        });

        afterEach(async function () {
            await killTerminalChannel('Init Camel Route file with JBang');

            await new EditorView().closeAllEditors();

            deleteFile(FILENAME.concat('.camel.xml'), RESOURCES);
        });

        it('Default version', async function () {
            await setJBangVersion(DEFAULT_JBANG);

            await initXMLFileWithJBang(driver, FILENAME);

            await waitUntilTerminalHasText(driver, `-Dcamel.jbang.version=${DEFAULT_JBANG}`);
            expect(await (await activateTerminalView()).getText()).to.contain(`-Dcamel.jbang.version=${DEFAULT_JBANG}`);
        });

        it('Older version', async function () {
            await setJBangVersion(OLDER_JBANG_VERSION);

            await initXMLFileWithJBang(driver, FILENAME);

            await waitUntilTerminalHasText(driver, `-Dcamel.jbang.version=${OLDER_JBANG_VERSION}`);
            expect(await (await activateTerminalView()).getText()).to.contain(`-Dcamel.jbang.version=${OLDER_JBANG_VERSION}`);
        });
    });
});
