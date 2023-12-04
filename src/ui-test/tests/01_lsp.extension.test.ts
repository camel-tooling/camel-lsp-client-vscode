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
	LSP_STATUS_BAR_MESSAGE,
	RESOURCES,
	closeEditor,
	waitUntilExtensionIsActivated,
} from '../utils/testUtils';
import {
	ActivityBar,
	after,
	before,
	By,
	EditorView,
	ExtensionsViewItem,
	ExtensionsViewSection,
	SideBarView,
	StatusBar,
	until,
	VSBrowser,
	ViewControl,
	WebDriver
} from 'vscode-uitests-tooling';
import * as pjson from '../../../package.json';

describe('Language Support for Apache Camel extension', function () {
	this.timeout(300000);

	let driver: WebDriver;

	before(async function () {
		driver = VSBrowser.instance.driver;

		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
	});

	describe('Extensions view', function () {
		let viewControl: ViewControl;
		let extensionsView: SideBarView;
		let item: ExtensionsViewItem;

		before(async function () {
			viewControl = await new ActivityBar().getViewControl('Extensions') as ViewControl;
			extensionsView = await viewControl.openView();
			await driver.wait(async function () {
				return (await extensionsView.getContent().getSections()).length > 0;
			});
		});

		after(async function () {
			await viewControl.closeView();
			await new EditorView().closeAllEditors();
		});

		it('Find extension', async function () {
			await driver.wait(async function () {
				item = await (await extensionsView.getContent().getSection('Installed') as ExtensionsViewSection).findItem(`@installed ${pjson.displayName}`);
				return item !== undefined;
			});
			assert.isNotNull(item);
		});

		it('Extension is installed', async function () {
			const installed = await item.isInstalled();
			assert.isTrue(installed);
		});

		it('Verify display name', async function () {
			const title = await item.getTitle();
			assert.equal(title, `${pjson.displayName}`);
		});

		// skipping because the description picked is the one of the pushed extension on Marketplace and not the one of the installed locally
		it.skip('Verify description', async function () {
			const desc = await item.getDescription();
			assert.equal(desc, `${pjson.description}`);
		});

		it('Verify version', async function () {
			const version = await item.getVersion();
			assert.equal(version, `${pjson.version}`);
		});
	});

	describe('Status bar', function () {
		before(async function () {
			await VSBrowser.instance.openResources(path.join(RESOURCES, CAMEL_CONTEXT_XML));
		});

		after(async function () {
			await closeEditor(CAMEL_CONTEXT_XML, false);
		});

		it('Language Support for Apache Camel started', async function () {
			const lsp = await driver.wait(until.elementLocated(By.id('redhat.vscode-apache-camel')), 35000);
			await driver.wait(async () => {
				const text = await lsp.getText().catch(() => '');
				try {
					const codicon = await lsp.findElement(By.className('codicon'))
					const klass = await codicon.getAttribute('class');
					return text.startsWith('Camel LS') && klass.includes('codicon-thumbsup');
				}
				catch {
					return false;
				}
			}, this.timeout() - 3000, `Could not find Apache Camel element with label '${LSP_STATUS_BAR_MESSAGE}'. Current label: '${await new StatusBar().getLSPSupport().catch(() => 'unknown')}'`);
		});
	});
});
