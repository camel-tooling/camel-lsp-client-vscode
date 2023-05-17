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
import * as pjson from '../../../package.json';
import * as utils from '../utils/testUtils';
import { assert } from 'chai';
import {
	after,
	before,
	By,
	EditorView,
	ExtensionsViewItem,
	TextEditor,
	until,
	VSBrowser,
	WebDriver,
	Workbench,
	Marketplace,
	StatusBar
} from 'vscode-uitests-tooling';

describe('Language Support for Apache Camel extension', function () {
	this.timeout(60000);

	const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');
	const CAMEL_CONTEXT_XML = 'camel-context.xml';
	const LSP_STATUS_BAR_MESSAGE = 'Camel LS';

	describe('Extensions view', function () {
		let marketplace: Marketplace;
		let item: ExtensionsViewItem;

		before(async function () {
			marketplace = await Marketplace.open(this.timeout());
		});

		after(async function () {
			await marketplace.close();
			await new EditorView().closeAllEditors();
		});

		it('Find extension', async function () {
			this.retries(5);
			item = await marketplace.findExtension(`@installed ${pjson.displayName}`);
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

		let driver: WebDriver;

		before(async function () {
			driver = VSBrowser.instance.driver;
			await utils.openFile(path.join(RESOURCES, CAMEL_CONTEXT_XML));
		});

		after(async function () {
			driver = VSBrowser.instance.driver;
			await driver.wait(async function () {
				const editor = new TextEditor();
				if (await editor.isDirty() === false) {
					return true;
				}

				const workbench = new Workbench();
				await workbench.executeCommand('File: Revert File');
				return false;
			});

			await new EditorView().closeAllEditors();
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
			}, this.timeout() - 3000, `Could not find Apache Camel element with label "${LSP_STATUS_BAR_MESSAGE}". Current label: "${await new StatusBar().getLSPSupport().catch(() => 'unknown')}"`);
		});
	});
});
