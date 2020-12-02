import * as path from 'path';
import * as pjson from '../../package.json';
import { assert } from 'chai';
import {
	By,
	EditorView,
	ExtensionsViewItem,
	ExtensionsViewSection,
	SideBarView,
	until,
	VSBrowser,
	WebDriver
} from 'vscode-extension-tester';
import {
	DefaultWait,
	Dialog,
	Marketplace,
	StatusBarExt
} from 'vscode-uitests-tooling';

describe('Language Support for Apache Camel extension', function () {

	const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');
	const CAMEL_CONTEXT_XML: string = 'camel-context.xml';
	const LSP_STATUS_BAR_MESSAGE: string = 'Apache Camel Language Server started';

	describe('Extensions view', function () {

		let marketplace: Marketplace;
		let section: ExtensionsViewSection;
		let item: ExtensionsViewItem;

		before(async function () {
			this.timeout(10000);
			marketplace = await Marketplace.open();
			await DefaultWait.sleep(1000);
			section = await new SideBarView().getContent().getSection('Installed') as ExtensionsViewSection;
		});

		after(async function () {
			await marketplace.close();
			await new EditorView().closeAllEditors();
		});

		it('Find extension', async function () {
			this.timeout(10000);
			item = await section.findItem(`@installed ${pjson.displayName}`);
		});

		it('Extension is installed', async function () {
			this.timeout(5000);
			const installed = await item.isInstalled();
			assert.isTrue(installed);
		});

		it('Verify display name', async function () {
			this.timeout(5000);
			const title = await item.getTitle();
			assert.equal(title, `${pjson.displayName}`);
		});

		it('Verify description', async function () {
			this.timeout(5000);
			const desc = await item.getDescription();
			assert.equal(desc, `${pjson.description}`);
		});

		it('Verify version', async function () {
			this.timeout(5000);
			const version = await item.getVersion();
			assert.equal(version, `${pjson.version}`);
		});
	});

	describe.skip('Status bar', function () {

		let driver: WebDriver;

		before(async function () {
			this.timeout(20000);
			driver = VSBrowser.instance.driver;
			await Dialog.openFile(path.join(RESOURCES, CAMEL_CONTEXT_XML));
		});

		after(async function () {
			await Dialog.closeFile(false);
		});

		it('Language Support for Apache Camel started', async function () {
			this.timeout(45000);
			await driver.wait(until.elementLocated(By.id('redhat.vscode-apache-camel')), 35000);
			const lsp = await new StatusBarExt().getLSPSupport();
			assert.equal(LSP_STATUS_BAR_MESSAGE, lsp);
		});
	});

});
