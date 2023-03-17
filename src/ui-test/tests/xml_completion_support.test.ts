import { EditorView, BottomBarPanel, MarkerType, VSBrowser, WebDriver, TextEditor, ContentAssist } from 'vscode-extension-tester';
import { WaitUntil, DefaultWait } from 'vscode-uitests-tooling';
import { assert } from 'chai';
import * as path from 'path';
import * as utils from '../utils/testUtils';

describe('XML DSL support', function () {
	this.timeout(60000);

	const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');
	const CAMEL_CONTEXT_XML = 'camel-context.xml';
	const CAMEL_ROUTE_XML = 'camel-route.xml';
	const URI_POSITION = 33;

	let contentAssist: ContentAssist;
	let driver: WebDriver;

	before(async function () {
		this.timeout(20000);
		driver = VSBrowser.instance.driver;
		VSBrowser.instance.waitForWorkbench();
	});

	const _setup = function (camel_xml: string) {
		return async function () {
			this.timeout(20000);
			await new EditorView().closeAllEditors();
			const absoluteCamelXmlPath = path.join(RESOURCES, camel_xml);
			await VSBrowser.instance.openResources(absoluteCamelXmlPath);
		}
	};

	const _clean = function (camel_xml: string) {
		return async function () {
			this.timeout(15000);
			await utils.closeEditor(camel_xml, false);
		}
	};

	describe('Camel URI code completion', function () {

		before(_setup(CAMEL_CONTEXT_XML));
		after(_clean(CAMEL_CONTEXT_XML));

		it('Open "camel-context.xml" file inside Editor View', async function () {
			const editor = await new EditorView().openEditor(CAMEL_CONTEXT_XML);
			const editorName = await editor.getTitle();
			assert.equal(editorName, CAMEL_CONTEXT_XML);
		});

		it('Code completion is working for component schemes (the part before the ":")', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(3, URI_POSITION, 'timer');
			const expectedContentAssist = 'timer:timerName'
			contentAssist = await waitUntilContentAssistContains(contentAssist, editor, expectedContentAssist);
			const timer = await contentAssist.getItem(expectedContentAssist);
			assert.equal(await utils.getTextExt(timer), expectedContentAssist);
			await timer.click();

			assert.equal((await editor.getTextAtLine(3)).trim(), '<from id="_fromID" uri="timer:timerName"/>');
		});

		it('Code completion is working for endpoint options (the part after the "?")', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(3, URI_POSITION + 15, '?');
			contentAssist = await waitUntilContentAssistContains(contentAssist, editor, 'delay');
			const delay = await contentAssist.getItem('delay');
			assert.equal(await utils.getTextExt(delay), 'delay');
			await delay.click();

			assert.equal((await editor.getTextAtLine(3)).trim(), '<from id="_fromID" uri="timer:timerName?delay=1000"/>');
		});

		it('Code completion is working for additional endpoint options (the part after "&")', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(3, URI_POSITION + 26, '&amp;exchange');
			contentAssist = await waitUntilContentAssistContains(contentAssist, editor, 'exchangePattern');
			const exchange = await contentAssist.getItem('exchangePattern');
			assert.equal(await utils.getTextExt(exchange), 'exchangePattern');
			await exchange.click();

			assert.equal((await editor.getTextAtLine(3)).trim(), '<from id="_fromID" uri="timer:timerName?delay=1000&amp;exchangePattern="/>');

			await editor.typeTextAt(3, URI_POSITION + 47, 'In');
			contentAssist = await waitUntilContentAssistContains(contentAssist, editor, 'InOnly');
			const inOnly = await contentAssist.getItem('InOnly');
			assert.equal(await utils.getTextExt(inOnly), 'InOnly');
			await inOnly.click();

			assert.equal((await editor.getTextAtLine(3)).trim(), '<from id="_fromID" uri="timer:timerName?delay=1000&amp;exchangePattern=InOnly"/>');
		});
	});

	describe('Endpoint options filtering', function () {

		before(_setup(CAMEL_CONTEXT_XML));
		after(_clean(CAMEL_CONTEXT_XML));

		it('Duplicate endpoint options are filtered out', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(3, URI_POSITION, 'timer');
			contentAssist = await waitUntilContentAssistContains(contentAssist, editor, 'timer:timerName');
			const timer = await contentAssist.getItem('timer:timerName');
			await timer.click();

			await editor.typeTextAt(3, URI_POSITION + 15, '?');
			contentAssist = await waitUntilContentAssistContains(contentAssist, editor, 'delay');
			const delay = await contentAssist.getItem('delay');
			await delay.click();

			await editor.typeTextAt(3, URI_POSITION + 26, '&amp;de');
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.DEFAULT);
			const filtered = await contentAssist.hasItem('delay');

			assert.isFalse(filtered);
			await editor.toggleContentAssist(false);
		});
	});

	describe('Diagnostics for Camel URIs', function () {

		const EXPECTED_ERROR_MESSAGE = 'Invalid duration value: 1000r';

		beforeEach(_setup(CAMEL_CONTEXT_XML));
		afterEach(_clean(CAMEL_CONTEXT_XML));

		it('LSP diagnostics support for XML DSL', async function () {
			this.retries(3);
			const editor = new TextEditor();

			await editor.typeTextAt(3, URI_POSITION, 'timer');
			contentAssist = await waitUntilContentAssistContains(contentAssist, editor, 'timer:timerName');
			const timer = await contentAssist.getItem('timer:timerName');
			await timer.click();

			await editor.typeTextAt(3, URI_POSITION + 15, '?');
			contentAssist = await waitUntilContentAssistContains(contentAssist, editor, 'delay');
			const delay = await contentAssist.getItem('delay');
			await delay.click();

			await editor.typeTextAt(3, URI_POSITION + 26, 'r');
			const problemsView = await utils.openView('Problems');

			await driver.wait(async function () {
				const innerMarkers = await problemsView.getAllMarkers(MarkerType.Error);
				return innerMarkers.length > 0;
			}, DefaultWait.TimePeriod.MEDIUM);
			const markers = await problemsView.getAllMarkers(MarkerType.Error);
			assert.isNotEmpty(markers, 'Problems view does not contains expected error');

			const errorMessage = await markers[0].getText();
			assert.include(errorMessage, EXPECTED_ERROR_MESSAGE);
			await new BottomBarPanel().toggle(false); // close Problems View
		});
	});

	describe('Auto-completion for referenced components IDs', function () {

		const DIRECT_COMPONENT_NAME = 'direct:testName';
		const DIRECT_VM_COMPONENT_NAME = 'direct-vm:testName2';

		before(_setup(CAMEL_ROUTE_XML));
		after(_clean(CAMEL_ROUTE_XML));

		it('Auto-completion for referenced ID of "direct" component', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(6, 29, DIRECT_COMPONENT_NAME);
			contentAssist = await waitUntilContentAssistContains(contentAssist, editor, DIRECT_COMPONENT_NAME);

			const direct = await contentAssist.getItem(DIRECT_COMPONENT_NAME);
			await direct.click();

			assert.equal((await editor.getTextAtLine(6)).trim(), '<to id="_toID" uri="direct:testName"/>');
		});

		it('Auto-completion for referenced ID of "direct-vm" component', async function () {
			const editor = new TextEditor();

			await editor.typeTextAt(13, 30, DIRECT_VM_COMPONENT_NAME);
			contentAssist = await waitUntilContentAssistContains(contentAssist, editor, DIRECT_VM_COMPONENT_NAME);

			const directVM = await contentAssist.getItem(DIRECT_VM_COMPONENT_NAME);
			await directVM.click();

			assert.equal((await editor.getTextAtLine(13)).trim(), '<to id="_toID2" uri="direct-vm:testName2"/>');
		});
	});

	async function waitUntilContentAssistContains(contentAssist: ContentAssist, editor: TextEditor, expectedContentAssist: string) {
		await driver.wait(async function () {
			contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
			const hasItem = await contentAssist.hasItem(expectedContentAssist);
			if (!hasItem) {
				await editor.toggleContentAssist(false);
			}
			return hasItem;
		}, DefaultWait.TimePeriod.DEFAULT);
		return contentAssist;
	}
});
