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
	BottomBarPanel,
	ContentAssist,
	DefaultWait,
	EditorView,
	MarkerType,
	TextEditor,
	VSBrowser,
	WaitUntil,
	WebDriver
} from 'vscode-uitests-tooling';
import * as ca from '../utils/contentAssist';
import {
	activateEditor,
	CAMEL_CONTEXT_JAVA,
	CAMEL_CONTEXT_XML,
	CAMEL_CONTEXT_YAML,
	CAMEL_ROUTE_XML,
	closeEditor,
	getTextExt,
	JAVA_URI_LINE,
	JAVA_URI_POSITION,
	openProblemsView,
	RESOURCES,
	XML_URI_LINE,
	XML_URI_POSITION,
	YAML_URI_LINE,
	YAML_URI_POSITION
} from '../utils/testUtils';

let driver: WebDriver;
let contentAssist: ContentAssist;
let editor: TextEditor;

const DSL_TIMEOUT = 300000;

describe('Language DSL support', function () {

	const _setup = function (camel_file: string) {
		return async function () {
			this.timeout(20000);
			await VSBrowser.instance.openResources(path.join(RESOURCES, camel_file));
			const ew = new EditorView();
			await ew.getDriver().wait(async function () {
				return (await ew.getOpenEditorTitles()).find(t => t === camel_file);
			}, 10000);
			editor = await activateEditor(driver, camel_file);
		}
	};

	const _clean = function (camel_file: string) {
		return async function () {
			this.timeout(15000);
			await closeEditor(camel_file, false);
		}
	};

	before(async function () {
		this.timeout(30000);
		driver = VSBrowser.instance.driver;
		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();
	});

	describe('XML DSL support', function () {
		this.timeout(DSL_TIMEOUT);

		describe('Camel URI code completion', function () {

			before(_setup(CAMEL_CONTEXT_XML));
			after(_clean(CAMEL_CONTEXT_XML));

			beforeEach(async function () {
				await activateEditor(driver, CAMEL_CONTEXT_XML);
			});

			it('Open "camel-context.xml" file inside Editor View', async function () {
				await openContextInsideEditorView(CAMEL_CONTEXT_XML);
			});

			it('Code completion is working for component schemes (the part before the ":")', async function () {
				await codeCompletionForComponentScheme(XML_URI_LINE, XML_URI_POSITION, '<from id="_fromID" uri="timer:timerName"/>');
			});

			it('Code completion is working for endpoint options (the part after the "?")', async function () {
				await codeCompletionForEndpointOptions(XML_URI_LINE, XML_URI_POSITION, '<from id="_fromID" uri="timer:timerName?delay=1000"/>');
			});

			it('Code completion is working for additional endpoint options (the part after "&")', async function () {
				await codeCompletionForAdditionalEndpointOptions(XML_URI_LINE, XML_URI_POSITION, true, '<from id="_fromID" uri="timer:timerName?delay=1000&amp;exchangePattern="/>');
				await codeCompletionForAdditionalEndpointOptionsValue(XML_URI_LINE, XML_URI_POSITION, true, '<from id="_fromID" uri="timer:timerName?delay=1000&amp;exchangePattern=InOnly"/>');
			});
		});

		describe('Endpoint options filtering', function () {

			before(_setup(CAMEL_CONTEXT_XML));
			after(_clean(CAMEL_CONTEXT_XML));

			beforeEach(async function () {
				await activateEditor(driver, CAMEL_CONTEXT_XML);
			});

			it('Duplicate endpoint options are filtered out', async function () {
				await duplicateEndpointOptionsFiltering(XML_URI_LINE, XML_URI_POSITION, true);
			});
		});

		describe('Diagnostics for Camel URIs', function () {

			before(_setup(CAMEL_CONTEXT_XML));
			after(_clean(CAMEL_CONTEXT_XML));

			beforeEach(async function () {
				await activateEditor(driver, CAMEL_CONTEXT_XML);
			});

			it('LSP diagnostics support for XML DSL', async function () {
				await lspDignosticSupport(XML_URI_LINE, XML_URI_POSITION);
			});
		});

		describe('Auto-completion for referenced components IDs', function () {

			before(_setup(CAMEL_ROUTE_XML));
			after(_clean(CAMEL_ROUTE_XML));

			beforeEach(async function () {
				await activateEditor(driver, CAMEL_ROUTE_XML);
			});

			it('Auto-completion for referenced ID of "direct" component', async function () {
				await autocompletionForReferenceIDofDirectComponent(6, 29, '<to id="_toID" uri="direct:testName"/>');
			});

			it('Auto-completion for referenced ID of "direct-vm" component', async function () {
				await autocompletionForReferenceIDofDirectVMComponent(13, 30, '<to id="_toID2" uri="direct-vm:testName2"/>');
			});
		});
	});

	describe('Java DSL support', function () {
		this.timeout(DSL_TIMEOUT);

		describe('Camel URI code completion', function () {

			before(_setup(CAMEL_CONTEXT_JAVA));
			after(_clean(CAMEL_CONTEXT_JAVA));

			beforeEach(async function () {
				editor = await activateEditor(driver, CAMEL_CONTEXT_JAVA);
			});

			it('Open "camel-context.java" file inside Editor View', async function () {
				await openContextInsideEditorView(CAMEL_CONTEXT_JAVA);
			});

			it('Code completion is working for component schemes (the part before the ":")', async function () {
				await codeCompletionForComponentScheme(JAVA_URI_LINE, JAVA_URI_POSITION, 'from("timer:timerName").routeId("_fromID");');
			});

			it('Code completion is working for endpoint options (the part after the "?")', async function () {
				await codeCompletionForEndpointOptions(JAVA_URI_LINE, JAVA_URI_POSITION, 'from("timer:timerName?delay=1000").routeId("_fromID");');
			});

			it('Code completion is working for additional endpoint options (the part after "&")', async function () {
				await codeCompletionForAdditionalEndpointOptions(JAVA_URI_LINE, JAVA_URI_POSITION, false, 'from("timer:timerName?delay=1000&exchangePattern=").routeId("_fromID");');
				await codeCompletionForAdditionalEndpointOptionsValue(JAVA_URI_LINE, JAVA_URI_POSITION, false, 'from("timer:timerName?delay=1000&exchangePattern=InOnly").routeId("_fromID");');
			});
		});

		describe('Endpoint options filtering', function () {

			before(_setup(CAMEL_CONTEXT_JAVA));
			after(_clean(CAMEL_CONTEXT_JAVA));

			beforeEach(async function () {
				await activateEditor(driver, CAMEL_CONTEXT_JAVA);
			});

			it('Duplicate endpoint options are filtered out', async function () {
				await duplicateEndpointOptionsFiltering(JAVA_URI_LINE, JAVA_URI_POSITION, false);
			});
		});

		describe('Diagnostics for Camel URIs', function () {

			before(_setup(CAMEL_CONTEXT_JAVA));
			after(_clean(CAMEL_CONTEXT_JAVA));

			beforeEach(async function () {
				await activateEditor(driver, CAMEL_CONTEXT_JAVA);
			});

			it('LSP diagnostics support for Java DSL', async function () {
				await lspDignosticSupport(JAVA_URI_LINE, JAVA_URI_POSITION);
			});
		});
	});

	describe('YAML DSL support', function () {
		this.timeout(DSL_TIMEOUT);

		describe('Camel URI code completion', function () {

			before(_setup(CAMEL_CONTEXT_YAML));
			after(_clean(CAMEL_CONTEXT_YAML));

			beforeEach(async function () {
				await activateEditor(driver, CAMEL_CONTEXT_YAML);
			});

			it('Open "camel-context.yaml" file inside Editor View', async function () {
				await openContextInsideEditorView(CAMEL_CONTEXT_YAML);
			});

			it('Code completion is working for component schemes (the part before the ":")', async function () {
				await codeCompletionForComponentScheme(YAML_URI_LINE, YAML_URI_POSITION, 'uri: timer:timerName');
			});

			it('Code completion is working for endpoint options (the part after the "?")', async function () {
				await codeCompletionForEndpointOptions(YAML_URI_LINE, YAML_URI_POSITION, 'uri: timer:timerName?delay=1000');
			});

			it('Code completion is working for additional endpoint options (the part after "&")', async function () {
				await codeCompletionForAdditionalEndpointOptions(YAML_URI_LINE, YAML_URI_POSITION, false, 'uri: timer:timerName?delay=1000&exchangePattern=');
				await codeCompletionForAdditionalEndpointOptionsValue(YAML_URI_LINE, YAML_URI_POSITION, false, 'uri: timer:timerName?delay=1000&exchangePattern=InOnly');
			});
		});

		describe('Endpoint options filtering', function () {

			before(_setup(CAMEL_CONTEXT_YAML));
			after(_clean(CAMEL_CONTEXT_YAML));

			beforeEach(async function () {
				await activateEditor(driver, CAMEL_CONTEXT_YAML);
			});

			it('Duplicate endpoint options are filtered out', async function () {
				await duplicateEndpointOptionsFiltering(YAML_URI_LINE, YAML_URI_POSITION, false);
			});
		});
	});
});

// Camel URI code completion
/**
 * Check, if required camel-context is opened inside editor. File is opened by before function.
 * 
 * @param filename Filename of camel-context.* inside resources folder.
 */
async function openContextInsideEditorView(filename: string): Promise<void> {
	const editorName = await editor.getTitle();
	assert.equal(editorName, filename);
}

/**
 * Code completion is working for component schemes (the part before the ":").
 * 
 * @param uriLine Line number containing uri. 
 * @param uriPosition Position of uri on line. 
 * @param completedLine Expected form of completed line.
 */
async function codeCompletionForComponentScheme(uriLine: number, uriPosition: number, completedLine: string): Promise<void> {
	await editor.typeTextAt(uriLine, uriPosition, 'timer');
	const expectedContentAssist = 'timer:timerName'
	contentAssist = await ca.waitUntilContentAssistContains(expectedContentAssist);

	const timer = await contentAssist.getItem(expectedContentAssist);
	assert.equal(await getTextExt(timer), expectedContentAssist);
	await timer.click();

	assert.equal((await editor.getTextAtLine(uriLine)).trim(), completedLine);
}

/**
 * Code completion is working for endpoint options (the part after the "?").
 * 
 * @param uriLine Line number containing uri. 
 * @param uriPosition Position of uri on line. 
 * @param completedLine Expected form of completed line.
 */
async function codeCompletionForEndpointOptions(uriLine: number, uriPosition: number, completedLine: string): Promise<void> {
	await editor.typeTextAt(uriLine, uriPosition + 15, '?');
	contentAssist = await ca.waitUntilContentAssistContains('delay');
	const delay = await contentAssist.getItem('delay');
	assert.equal(await getTextExt(delay), 'delay');
	await delay.click();

	assert.equal((await editor.getTextAtLine(uriLine)).trim(), completedLine);
}

/**
 * Code completion is working for additional endpoint options (the part after "&").
 * 
 * @param uriLine Line number containing uri. 
 * @param uriPosition Position of uri on line. 
 * @param anAmpersand Should be used '&amp;' instead of '&'.
 * @param completedLine Expected form of completed line.
 */
async function codeCompletionForAdditionalEndpointOptions(uriLine: number, uriPosition: number, anAmpersand: boolean, completedLine: string): Promise<void> {
	if (anAmpersand) {
		await editor.typeTextAt(uriLine, uriPosition + 26, '&amp;exchange');
	} else {
		await editor.typeTextAt(uriLine, uriPosition + 26, '&');
	}
	contentAssist = await ca.waitUntilContentAssistContains('exchangePattern');
	const exchange = await contentAssist.getItem('exchangePattern');
	assert.equal(await getTextExt(exchange), 'exchangePattern');
	await exchange.click();

	assert.equal((await editor.getTextAtLine(uriLine)).trim(), completedLine);
}

/**
 * Code completion is working for additional endpoint options (the part after "&") with value. 
 * 
 * @param uriLine Line number containing uri. 
 * @param uriPosition Position of uri on line. 
 * @param anAmpersand Should be used '&amp;' instead of '&'.
 * @param completedLine Expected form of completed line.
 */
async function codeCompletionForAdditionalEndpointOptionsValue(uriLine: number, uriPosition: number, anAmpersand: boolean, completedLine: string): Promise<void> {
	if (anAmpersand) {
		await editor.typeTextAt(uriLine, uriPosition + 47, 'In');
	} else {
		await editor.typeTextAt(uriLine, uriPosition + 43, 'In');
	}

	contentAssist = await ca.waitUntilContentAssistContains('InOnly');
	const inOnly = await contentAssist.getItem('InOnly');
	assert.equal(await getTextExt(inOnly), 'InOnly');
	await inOnly.click();

	assert.equal((await editor.getTextAtLine(uriLine)).trim(), completedLine);
}

// Endpoint options filtering
/**
 * Duplicate endpoint options are filtered out.
 * 
 * @param uriLine Line number containing uri. 
 * @param uriPosition Position of uri on line. 
 * @param anAmpersand Should be used '&amp;' instead of '&'.
 */
async function duplicateEndpointOptionsFiltering(uriLine: number, uriPosition: number, anAmpersand: boolean): Promise<void> {
	await editor.typeTextAt(uriLine, uriPosition, 'timer');
	contentAssist = await ca.waitUntilContentAssistContains('timer:timerName');
	const timer = await contentAssist.getItem('timer:timerName');
	await timer.click();

	await editor.typeTextAt(uriLine, uriPosition + 15, '?');
	contentAssist = await ca.waitUntilContentAssistContains('delay');
	const delay = await contentAssist.getItem('delay');
	await delay.click();

	if (anAmpersand) {
		await editor.typeTextAt(uriLine, uriPosition + 26, '&amp;de');
	} else {
		await editor.typeTextAt(uriLine, uriPosition + 26, '&de');
	}

	contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
	await new WaitUntil().assistHasItems(contentAssist, DefaultWait.TimePeriod.DEFAULT);
	const filtered = await contentAssist.hasItem('delay');

	assert.isFalse(filtered);
	await editor.toggleContentAssist(false);
}

// Diagnostics for Camel URIs - XML ONLY
/**
 * LSP diagnostics support for XML DSL.
 * 
 * @param uriLine Line number containing uri. 
 * @param uriPosition Position of uri on line. 
 */
async function lspDignosticSupport(uriLine: number, uriPosition: number): Promise<void> {
	const EXPECTED_ERROR_MESSAGE = 'Invalid duration value: 1000r';

	await editor.typeTextAt(uriLine, uriPosition, 'timer');
	contentAssist = await ca.waitUntilContentAssistContains('timer:timerName');
	const timer = await contentAssist.getItem('timer:timerName');
	await timer.click();

	await editor.typeTextAt(uriLine, uriPosition + 15, '?');
	contentAssist = await ca.waitUntilContentAssistContains('delay');
	const delay = await contentAssist.getItem('delay');
	await delay.click();

	await editor.typeTextAt(uriLine, uriPosition + 26, 'r');
	const problemsView = await openProblemsView();

	await driver.wait(async function () {
		const innerMarkers = await problemsView.getAllVisibleMarkers(MarkerType.Error);
		return innerMarkers.length > 0;
	}, DefaultWait.TimePeriod.MEDIUM);
	const markers = await problemsView.getAllVisibleMarkers(MarkerType.Error);
	assert.isNotEmpty(markers, 'Problems view does not contains expected error');

	const errorMessage = await markers[0].getText();
	assert.include(errorMessage, EXPECTED_ERROR_MESSAGE);
	await new BottomBarPanel().toggle(false); // close Problems View
}

// Auto-completion for referenced components IDs - XML ONLY
/**
 * Auto-completion for referenced ID of "direct" component.
 * 
 * @param uriLine Line number containing uri. 
 * @param uriPosition Position of uri on line. 
 * @param completedLine Expected form of completed line.
 */
async function autocompletionForReferenceIDofDirectComponent(uriLine: number, uriPosition: number, completedLine: string): Promise<void> {
	const DIRECT_COMPONENT_NAME = 'direct:testName';

	await editor.typeTextAt(uriLine, uriPosition, DIRECT_COMPONENT_NAME);
	contentAssist = await ca.waitUntilContentAssistContains(DIRECT_COMPONENT_NAME);

	const direct = await contentAssist.getItem(DIRECT_COMPONENT_NAME);
	await direct.click();

	assert.equal((await editor.getTextAtLine(uriLine)).trim(), completedLine);
}

/**
 * Auto-completion for referenced ID of "direct-vm" component.
 * 
 * @param uriLine Line number containing uri. 
 * @param uriPosition Position of uri on line. 
 * @param completedLine Expected form of completed line.
 */
async function autocompletionForReferenceIDofDirectVMComponent(uriLine: number, uriPosition: number, completedLine: string): Promise<void> {
	const DIRECT_VM_COMPONENT_NAME = 'direct-vm:testName2';

	await editor.typeTextAt(uriLine, uriPosition, DIRECT_VM_COMPONENT_NAME);
	contentAssist = await ca.waitUntilContentAssistContains(DIRECT_VM_COMPONENT_NAME);

	const directVM = await contentAssist.getItem(DIRECT_VM_COMPONENT_NAME);
	await directVM.click();

	assert.equal((await editor.getTextAtLine(uriLine)).trim(), completedLine);
}
