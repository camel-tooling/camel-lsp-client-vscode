import { EditorView, ExtensionsViewSection, ActivityBar, ExtensionsViewItem } from 'vscode-extension-tester';
import { DefaultFileDialog, DefaultStatusBar } from 'vscode-uitests-tooling';
import * as path from 'path';
import { assert } from 'chai';
import * as pjson from '../../package.json';

describe('Language Support for Apache Camel extension', function () {

	const RESOURCES = path.resolve('src', 'ui-test', 'resources');
	const CAMEL_CONTEXT_XML = 'camel-context.xml';
	const LSP_STATUS_BAR_MESSAGE = 'Apache Camel Language Server started';

	describe('Extensions view', function () {

		let section: ExtensionsViewSection;
		let item: ExtensionsViewItem;

		before(async function () {
			this.timeout(10000);
			const view = await new ActivityBar().getViewControl('Extensions').openView();
			section = await view.getContent().getSection('Enabled') as ExtensionsViewSection;
		});

		after(async function () {
			await new ActivityBar().getViewControl('Extensions').closeView();
			await new EditorView().closeAllEditors();
		});

		it('Find extension', async function () {
			this.timeout(10000);
			item = await section.findItem(`@installed ${pjson.displayName}`) as ExtensionsViewItem;
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

	describe('Status bar', function () {

		before(async function () {
			this.timeout(20000);
			await new DefaultFileDialog().openFile(path.join(RESOURCES, CAMEL_CONTEXT_XML));
		});

		after(async function () {
			await new EditorView().closeAllEditors();
		});

		it('Language Support for Apache Camel started', async function () {
			this.timeout(10000);
			const lsp = await new DefaultStatusBar().getLSPSupport();
			assert.equal(LSP_STATUS_BAR_MESSAGE, lsp);
		});
	});

});
