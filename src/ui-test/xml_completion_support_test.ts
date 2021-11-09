import { EditorView, BottomBarPanel, MarkerType, ContentAssistItem, TitleBar, VSBrowser } from 'vscode-extension-tester';
import { WaitUntil, DefaultWait, Workbench, ContentAssist, TextEditor } from 'vscode-uitests-tooling';
import * as path from 'path';
import { assert } from 'chai';

describe('XML DSL support', function () {
	this.timeout(60000);

	const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');
	const CAMEL_CONTEXT_XML: string = 'camel-context.xml';
	const CAMEL_ROUTE_XML: string = 'camel-route.xml';
	const URI_POSITION: number = 33;

	let contentAssist: ContentAssist;

	const _setup = function (camel_xml: string) {
		return async function () {
			this.timeout(20000);
			const editorView = new EditorView();
			await editorView.closeAllEditors();
			const absoluteCamelXmlPath = path.join(__dirname, '../../../src/ui-test/resources', camel_xml);
			await openFile(absoluteCamelXmlPath);
		}
	};

	async function openFile(fileToOpenAbsolutePath?: string): Promise<void> {
		await new Workbench().openFile(fileToOpenAbsolutePath);
	}

	const _clean = async function () {
		this.timeout(15000);
		const driver = VSBrowser.instance.driver;
		await driver.wait(async function () {
			const editor = new TextEditor();
			if (await editor.isDirty() === false) {
				return true;
			}

			await new TitleBar().select('File', 'Revert File');
			return false;
		});

		await new EditorView().closeAllEditors();
	};

	describe('Camel URI code completion', function () {

		before(_setup(CAMEL_CONTEXT_XML));
		after(_clean);

		it('Open "camel-context.xml" file inside Editor View', async function () {
			const editor = await new EditorView().openEditor(CAMEL_CONTEXT_XML);
			const editorName = await editor.getTitle();
			assert.equal(editorName, CAMEL_CONTEXT_XML);
		});

		it('Code completion is working for component schemes (the part before the ":")', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(3, URI_POSITION, 'timer');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const timer = await contentAssist.getItem('timer:timerName');
			assert.equal(await getTextExt(timer), 'timer:timerName');
			await timer.click();

			assert.equal((await editor.getTextAtLine(3)).trim(), '<from id="_fromID" uri="timer:timerName"/>');
		});

		it('Code completion is working for endpoint options (the part after the "?")', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(3, URI_POSITION + 15, '?');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const delay = await contentAssist.getItem('delay');
			assert.equal(await getTextExt(delay), 'delay');
			await delay.click();

			assert.equal((await editor.getTextAtLine(3)).trim(), '<from id="_fromID" uri="timer:timerName?delay=1s"/>');
		});

		it('Code completion is working for additional endpoint options (the part after "&")', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(3, URI_POSITION + 24, '&amp;exchange');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const exchange = await contentAssist.getItem('exchangePattern');
			assert.equal(await getTextExt(exchange), 'exchangePattern');
			await exchange.click();

			assert.equal((await editor.getTextAtLine(3)).trim(), '<from id="_fromID" uri="timer:timerName?delay=1s&amp;exchangePattern="/>');

			await editor.typeTextAt(3, URI_POSITION + 45, 'In');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const inOnly = await contentAssist.getItem('InOnly');
			assert.equal(await getTextExt(inOnly), 'InOnly');
			await inOnly.click();

			assert.equal((await editor.getTextAtLine(3)).trim(), '<from id="_fromID" uri="timer:timerName?delay=1s&amp;exchangePattern=InOnly"/>');
		});
	});

	describe('Endpoint options filtering', function () {

		before(_setup(CAMEL_CONTEXT_XML));
		after(_clean);

		it('Duplicate endpoint options are filtered out', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(3, URI_POSITION, 'timer');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const timer = await contentAssist.getItem('timer:timerName');
			await timer.click();

			await editor.typeTextAt(3, URI_POSITION + 15, '?');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const delay = await contentAssist.getItem('delay');
			await delay.click();

			await editor.typeTextAt(3, URI_POSITION + 24, '&amp;de');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const filtered = await contentAssist.hasItem('delay');

			assert.isFalse(filtered);
			await editor.toggleContentAssist(false);
		});
	});

	describe('Diagnostics for Camel URIs', function () {

		const EXPECTED_ERROR_MESSAGE: string = 'Invalid duration value: 1sr';

		beforeEach(_setup(CAMEL_CONTEXT_XML));
		afterEach(_clean);

		it('LSP diagnostics support for XML DSL', async function () {
			this.retries(3);
			const editor = new TextEditor();

			await editor.typeTextAt(3, URI_POSITION, 'timer');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const timer = await contentAssist.getItem('timer:timerName');
			await timer.click();

			await editor.typeTextAt(3, URI_POSITION + 15, '?');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const delay = await contentAssist.getItem('delay');
			await delay.click();

			await editor.typeTextAt(3, URI_POSITION + 24, 'r');
			const problemsView = await new BottomBarPanel().openProblemsView();
			editor.getDriver().wait(async function() {
				const innerMarkers = await problemsView.getAllMarkers(MarkerType.Error);
				return innerMarkers.length > 0;
			}, DefaultWait.TimePeriod.MEDIUM);
			const markers = await problemsView.getAllMarkers(MarkerType.Error);
			assert.isNotEmpty(markers, 'Problems view does not contains expected error');

			const marker = markers[0];
			const errorMessage = await marker.getText();
			assert.include(errorMessage, EXPECTED_ERROR_MESSAGE);
			await new BottomBarPanel().toggle(false); // close Problems View
		});
	});

	describe('Auto-completion for referenced components IDs', function () {

		const DIRECT_COMPONENT_NAME: string = 'direct:testName';
		const DIRECT_VM_COMPONENT_NAME: string = 'direct-vm:testName2';

		before(_setup(CAMEL_ROUTE_XML));
		after(_clean);

		it('Auto-completion for referenced ID of "direct" component', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(6, 29, DIRECT_COMPONENT_NAME);
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			assert.isTrue(await contentAssist.hasItem(DIRECT_COMPONENT_NAME));

			const direct = await contentAssist.getItem(DIRECT_COMPONENT_NAME);
			await direct.click();

			assert.equal((await editor.getTextAtLine(6)).trim(), '<to id="_toID" uri="direct:testName"/>');
		});

		it('Auto-completion for referenced ID of "direct-vm" component', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(13, 30, DIRECT_VM_COMPONENT_NAME);
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			assert.isTrue(await contentAssist.hasItem(DIRECT_VM_COMPONENT_NAME))

			const directVM = await contentAssist.getItem(DIRECT_VM_COMPONENT_NAME);
			await directVM.click();

			assert.equal((await editor.getTextAtLine(13)).trim(), '<to id="_toID2" uri="direct-vm:testName2"/>');
		});
	});

	/**
	 * Workaround for issue with ContentAssistItem getText() method
	 * For more details please see https://github.com/djelinek/vscode-uitests-tooling/issues/17
	 *
	 * @param item ContenAssistItem
	 */
	async function getTextExt(item: ContentAssistItem): Promise<string> {
		const name: string = await item.getText();
		return name.split('\n')[0];
	}
});
