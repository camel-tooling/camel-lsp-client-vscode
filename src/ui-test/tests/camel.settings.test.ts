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
import { assert } from 'chai';
import {
	CAMEL_CONTEXT_XML,
	CATALOG_PROVIDER_ID,
	CATALOG_VERSION_ID,
	closeEditor,
	deleteFile,
	EXTRA_COMPONENTS_ID,
	getJBangVersion,
	getTextExt,
	initXMLFileWithJBang,
	JBANG_VERSION_ID,
	killTerminal,
	resetUserSettings,
	RESOURCES,
	setAdditionalComponents,
	setCamelCatalogVersion,
	setJBangVersion,
	setRuntimeProvider,
	waitUntilEditorIsOpened,
	waitUntilExtensionIsActivated,
	waitUntilFileAvailable,
	waitUntilTerminalHasText,
	XML_URI_POSITION
} from '../utils/testUtils';
import {
	ActivityBar,
	ContentAssist,
	EditorView,
	TextEditor,
	VSBrowser,
	WebDriver
} from 'vscode-uitests-tooling';
import * as pjson from '../../../package.json';

describe('User preferences', function () {

	let driver: WebDriver;
	let contentAssist: ContentAssist;

	before(async function () {
		this.timeout(40000);
		driver = VSBrowser.instance.driver;
		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
		await (await new ActivityBar().getViewControl('Explorer')).openView();
	});

	describe('Camel Runtime Provider', function () {
		this.timeout(90000);

		const PROVIDERS_LIST = [
			{ runtime: 'SPRINGBOOT', knative: true, mongo: true, jmx: true },
			{ runtime: 'QUARKUS', knative: true, mongo: true, jmx: false },
			{ runtime: 'KARAF', knative: false, mongo: true, jmx: true }
		];

		after(function () {
			resetUserSettings(CATALOG_PROVIDER_ID);
		});

		PROVIDERS_LIST.forEach(function (provider) {
			describe(`${provider.runtime}`, function () {

				const COMPONENTS = [
					{ name: 'knative', property: 'knative:type/typeId' },
					{ name: 'mongo', property: 'mongodb:connectionBean' },
					{ name: 'jmx', property: 'jmx:serverURL' }
				];

				before(async function () {
					await setRuntimeProvider(provider.runtime);
				});

				beforeEach(async function () {
					await VSBrowser.instance.openResources(path.join(RESOURCES, CAMEL_CONTEXT_XML));
					await waitUntilEditorIsOpened(driver, CAMEL_CONTEXT_XML);
				});

				afterEach(async function () {
					await closeEditor(CAMEL_CONTEXT_XML, false);
				});

				it(`${COMPONENTS[0].name} component`, async function () {
					await testComponentInXML(COMPONENTS[0].name, COMPONENTS[0].property, provider.knative, 1);
				});

				it(`${COMPONENTS[1].name} component`, async function () {
					await testComponentInXML(COMPONENTS[1].name, COMPONENTS[1].property, provider.mongo, 2);
				});

				it(`${COMPONENTS[2].name} component`, async function () {
					await testComponentInXML(COMPONENTS[2].name, COMPONENTS[2].property, provider.jmx, 1);
				});
			});
		});
	});

	describe('Camel Catalog version', function () {
		this.timeout(90000);

		after(async function () {
			await new EditorView().closeAllEditors();
			resetUserSettings(CATALOG_VERSION_ID);
		});

		afterEach(async function () {
			// close file w\o saving
			await closeEditor(CAMEL_CONTEXT_XML, false);
		});

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
		});
	});

	describe('JBang version', function () {
		this.timeout(90000);

		const FILENAME = 'test';
		const FILENAME_SUFFIX = 'test.camel.xml';

		after(async function () {
			await new EditorView().closeAllEditors();
			resetUserSettings(JBANG_VERSION_ID);
		});

		afterEach(async function () {
			await new EditorView().closeAllEditors();
			await killTerminal();
			await deleteFile(FILENAME_SUFFIX, RESOURCES);
		});

		const parameters = [
			{ label: 'Default', version: '' },
			{ label: 'Older', version: '3.21.0' }
		];

		parameters.forEach(function (param) {

			it(`${param.label} version`, async function () {
				if (param.version) {
					await setJBangVersion(param.version);
				}
				const currentJbangVersion = await getJBangVersion();
				await initXMLFileWithJBang(driver, FILENAME);

				await waitUntilTerminalHasText(driver, `-Dcamel.jbang.version=${currentJbangVersion}`);
				await waitUntilFileAvailable(driver, FILENAME_SUFFIX, undefined, 60000);
				await waitUntilEditorIsOpened(driver, FILENAME_SUFFIX);
			});
		});
	});

	describe('Additional Camel components', function () {
		this.timeout(90000);

		const EXTRA_COMPONENT = `
        "camel.extra-components": [
            {
                "component": {
                    "kind": "component",
                    "scheme": "abcd",
                    "syntax": "abcd:xyz"
                }
            }
        ]
        `;

		beforeEach(async function () {
			await VSBrowser.instance.openResources(path.join(RESOURCES, CAMEL_CONTEXT_XML));
			await waitUntilEditorIsOpened(driver, CAMEL_CONTEXT_XML);
		});

		after(async function () {
			await new EditorView().closeAllEditors();
			resetUserSettings(EXTRA_COMPONENTS_ID);
		});

		afterEach(async function () {
			await closeEditor(CAMEL_CONTEXT_XML, false);
		});

		it('No extra component available', async function () {
			await testComponentInXML('abcd', 'abcd:xyz', false, 0);
		});

		it('Extra component available', async function () {
			await setAdditionalComponents(EXTRA_COMPONENT);
			await testComponentInXML('abcd', 'abcd:xyz', true, 1);
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
	async function testComponentInXML(component: string, proposal: string, proposalAvailable: boolean, proposalsCount: number): Promise<void> {
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
