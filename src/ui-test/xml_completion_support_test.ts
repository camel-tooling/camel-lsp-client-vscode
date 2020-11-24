import { EditorView, TextEditor, ContentAssist, BottomBarPanel, MarkerType, ContentAssistItem, VSBrowser, Editor, TitleBar, WebDriver } from 'vscode-extension-tester';
import { Dialog, WaitUntil, DefaultWait } from 'vscode-uitests-tooling';
import * as path from 'path';
import { assert } from 'chai';

describe('XML DSL support', function () {

	const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');
	const CAMEL_CONTEXT_XML: string = 'camel-context.xml';
	const CAMEL_ROUTE_XML: string = 'camel-route.xml';
	const URI_POSITION: number = 33;
	const BASE_TIMEOUT = 80000;

	let contentAssist: ContentAssist;

	const _setup = function (camel_xml: string) {
		return async function () {
			await asyncSetup(BASE_TIMEOUT, RESOURCES, camel_xml);
		}
	};

	const _clean = function (camel_xml: string) {
		return async function () {
			//await Dialog.closeFile(false);
			await asyncClean(BASE_TIMEOUT, camel_xml);
		}
	}

	describe('Camel URI code completion', function () {

		// before(_setup(CAMEL_CONTEXT_XML));
		// after(_clean(CAMEL_CONTEXT_XML));

		it('Open "camel-context.xml" file inside Editor View', async function () {
			this.timeout(BASE_TIMEOUT);
			await asyncSetup(BASE_TIMEOUT, RESOURCES, CAMEL_CONTEXT_XML);

			const editor = await new EditorView().openEditor(CAMEL_CONTEXT_XML);
			const editorName = await editor.getTitle();
			assert.equal(editorName, CAMEL_CONTEXT_XML);
		});

		it('Code completion is working for component schemes (the part before the ":")', async function () {
			this.timeout(BASE_TIMEOUT);
			const editor = new TextEditor();

			await editor.typeText(3, URI_POSITION, 'timer');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const timer = await contentAssist.getItem('timer');
			assert.equal(await getTextExt(timer), 'timer:timerName');
			await timer.click();

			assert.equal('<from id="_fromID" uri="timer:timerName"/>', (await editor.getTextAtLine(3)).trim());
		});

		it('Code completion is working for endpoint options (the part after the "?")', async function () {
			this.timeout(BASE_TIMEOUT);
			const editor = new TextEditor();

			await editor.typeText(3, URI_POSITION + 15, '?');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const delay = await contentAssist.getItem('delay');
			assert.equal(await getTextExt(delay), 'delay');
			await delay.click();

			assert.equal('<from id="_fromID" uri="timer:timerName?delay=1s"/>', (await editor.getTextAtLine(3)).trim());
		});

		it('Code completion is working for additional endpoint options (the part after "&")', async function () {
			this.timeout(45000);
			const editor = new TextEditor();

			await editor.typeText(3, URI_POSITION + 24, '&amp;exchange');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const exchange = await contentAssist.getItem('exchange');
			assert.equal(await getTextExt(exchange), 'exchangePattern');
			await exchange.click();

			assert.equal('<from id="_fromID" uri="timer:timerName?delay=1s&amp;exchangePattern="/>', (await editor.getTextAtLine(3)).trim());
			await editor.typeText(3, URI_POSITION + 45, 'In');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const inOnly = await contentAssist.getItem('In');
			assert.equal(await getTextExt(inOnly), 'InOnly');
			await inOnly.click();

			assert.equal('<from id="_fromID" uri="timer:timerName?delay=1s&amp;exchangePattern=InOnly"/>', (await editor.getTextAtLine(3)).trim());
			await asyncClean(BASE_TIMEOUT, CAMEL_CONTEXT_XML);
		});
	});

	describe('Endpoint options filtering', function () {

		//before(_setup(CAMEL_CONTEXT_XML));
		//after(_clean(CAMEL_CONTEXT_XML));

		it('Duplicate endpoint options are filtered out', async function () {
			await asyncSetup(BASE_TIMEOUT, RESOURCES, CAMEL_CONTEXT_XML);
			this.timeout(BASE_TIMEOUT);
			const editor = new TextEditor();

			await editor.typeText(3, URI_POSITION, 'timer');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const timer = await contentAssist.getItem('timer');
			await timer.click();

			await editor.typeText(3, URI_POSITION + 15, '?');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const delay = await contentAssist.getItem('delay');
			await delay.click();

			await editor.typeText(3, URI_POSITION + 24, '&amp;de');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const filtered = await contentAssist.hasItem('delay');

			assert.isFalse(filtered);
			await editor.toggleContentAssist(false);
			await asyncClean(BASE_TIMEOUT, CAMEL_CONTEXT_XML);
		});
	});

	describe('Diagnostics for Camel URIs', function () {

		const EXPECTED_ERROR_MESSAGE: string = 'Invalid duration value: 1sr';

		// before(_setup(CAMEL_CONTEXT_XML));
		// after(_clean(CAMEL_CONTEXT_XML));

		it('LSP diagnostics support for XML DSL', async function () {
			await asyncSetup(BASE_TIMEOUT, RESOURCES, CAMEL_CONTEXT_XML);
			this.timeout(BASE_TIMEOUT);
			const editor = new TextEditor();

			await editor.typeText(3, URI_POSITION, 'timer');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const timer = await contentAssist.getItem('timer');
			await timer.click();

			await editor.typeText(3, URI_POSITION + 15, '?');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			const delay = await contentAssist.getItem('delay');
			await delay.click();

			await editor.typeText(3, URI_POSITION + 24, 'r');
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
			await asyncClean(BASE_TIMEOUT, CAMEL_CONTEXT_XML)
		});
	});

	describe('Auto-completion for referenced components IDs', function () {

		const DIRECT_COMPONENT_NAME: string = 'direct:testName';
		const DIRECT_VM_COMPONENT_NAME: string = 'direct-vm:testName2';

		// before(_setup(CAMEL_ROUTE_XML));
		// after(_clean(CAMEL_ROUTE_XML));

		it('Auto-completion for referenced ID of "direct" component', async function () {
			this.timeout(BASE_TIMEOUT);
			await asyncSetup(BASE_TIMEOUT, RESOURCES, CAMEL_ROUTE_XML);
			const editor = new TextEditor();

			await editor.typeText(6, 29, DIRECT_COMPONENT_NAME);
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			assert.isTrue(await contentAssist.hasItem(DIRECT_COMPONENT_NAME));

			const direct = await contentAssist.getItem(DIRECT_COMPONENT_NAME);
			await direct.click();

			assert.equal('<to id="_toID" uri="direct:testName"/>', (await editor.getTextAtLine(6)).trim());
		});

		it('Auto-completion for referenced ID of "direct-vm" component', async function () {
			this.timeout(BASE_TIMEOUT);
			const editor = new TextEditor();

			await editor.typeText(13, 30, DIRECT_VM_COMPONENT_NAME);
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.MEDIUM);
			assert.isTrue(await contentAssist.hasItem(DIRECT_VM_COMPONENT_NAME))

			const directVM = await contentAssist.getItem(DIRECT_VM_COMPONENT_NAME);
			await directVM.click();

			assert.equal('<to id="_toID2" uri="direct-vm:testName2"/>', (await editor.getTextAtLine(13)).trim());
			await asyncClean(BASE_TIMEOUT, CAMEL_ROUTE_XML);
		});
	});

	/**
	 * Workaround for issue with ContentAssistItem getText() method
	 * For more details please see https://github.com/djelinek/vscode-uitests-tooling/issues/17
	 *
	 * @param item ContenAssistItem
	 */
	async function getTextExt(item: ContentAssistItem): Promise<String> {
		let name: string = '';
		name = await item.getText();
		return name.split('\n')[0];
	}
});

async function asyncClean(BASE_TIMEOUT: number, camel_xml: string) {
	const editorView = new EditorView();
	const titleBar = new TitleBar();
	await titleBar.select('File', 'Revert File');
	const driver = VSBrowser.instance.driver;
	await driver.wait(async function () {
		const editor = new TextEditor();
		console.log(`editor with name ${await editor.getTitle()} is dirty? ${await editor.isDirty()}`);
		return !(await editor.isDirty());
	}, BASE_TIMEOUT);

	await editorView.closeEditor(camel_xml);
	await driver.wait(async function () {
		//const editorView = new EditorView();
		const openedEditors = await editorView.getOpenEditorTitles();
		console.log(`awaiting editor with title ${camel_xml} to close. Currently opened: ${openedEditors.join(';')}`);
		return openedEditors === undefined || !openedEditors.includes(camel_xml);
	}, BASE_TIMEOUT);
}

async function asyncSetup(BASE_TIMEOUT: number, RESOURCES: string, camel_xml: string) {
	//this.timeout(BASE_TIMEOUT);
	const editorView = new EditorView();
	await editorView.closeAllEditors();
	await Dialog.openFile(path.join(RESOURCES, camel_xml));
	await awaitEditor(camel_xml, BASE_TIMEOUT);
}

async function awaitEditor(camel_xml: string, BASE_TIMEOUT: number) {
	const driver = VSBrowser.instance.driver;
	try {
	await driver.wait(async function () {
		const editorView = new EditorView();
		const openedEditors = await editorView.getOpenEditorTitles();
		console.log(`awaiting editor with title ${camel_xml} to open. Currently opened: ${openedEditors.join(';')}`);
		return openedEditors !== undefined && openedEditors.includes(camel_xml);
	}, BASE_TIMEOUT);
	} catch (e) {
		console.log(await driver.takeScreenshot());
		throw e;
	}
}
