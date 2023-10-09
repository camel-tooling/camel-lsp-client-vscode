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
	DefaultTreeSection,
	DefaultWait,
	EditorView,
	MarkerType,
	SideBarView,
	TextEditor,
	VSBrowser,
	WaitUntil,
	WebDriver,
	Workbench
} from 'vscode-uitests-tooling';
import * as ca from '../utils/contentAssist';
import {
	activateEditor,
	CAMEL_CONTEXT_JAVA,
	CAMEL_CONTEXT_XML,
	CAMEL_CONTEXT_YAML,
	CAMEL_ROUTE_XML,
	clearReferences,
	closeEditor,
	getTextExt,
	GROOVY_TESTFILE,
	GROOVY_URI_LINE,
	GROOVY_URI_POSITION,
	isReferencesAvailable,
	JAVA_URI_LINE,
	JAVA_URI_POSITION,
	JS_TESTFILE,
	JS_URI_LINE,
	JS_URI_POSITION,
	KOTLIN_TESTFILE,
	KOTLIN_URI_LINE,
	KOTLIN_URI_POSITION,
	openFileInEditor,
	openProblemsView,
	REFERENCES_FILE_1,
	REFERENCES_FILE_2,
	RESOURCES,
	RESOURCES_REFERENCES,
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
				await lspDiagnosticSupport(XML_URI_LINE, XML_URI_POSITION);
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

		describe('Find references for direct and direct VM components', function () {

			beforeEach(async function () {
				await openFileInEditor(driver, RESOURCES_REFERENCES, REFERENCES_FILE_1);
			});

			afterEach(async function () {
				await clearReferences();
				await new EditorView().closeAllEditors();
			});

			it('direct reference not available while file with components not opened', async function () {
				await noReferenceAvailable(5, 32);
			});

			it('direct reference available while file with components opened', async function () {
				await referenceAvailable(5, 32, 'myDirectIDFromAnotherFile"/>');
			});

			it('direct-vm reference not available while file with components not opened', async function () {
				await noReferenceAvailable(10, 32);
			});

			it('direct-vm reference available while file with components opened', async function () {
				await referenceAvailable(10, 32, 'myDirectVMIDFromAnotherFile"/>');
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
				await lspDiagnosticSupport(JAVA_URI_LINE, JAVA_URI_POSITION);
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

	describe('Groovy DSL support', function () {
		this.timeout(DSL_TIMEOUT);

        before(_setup(GROOVY_TESTFILE));
        after(_clean(GROOVY_TESTFILE));
        
        beforeEach(async function () {
            await activateEditor(driver, GROOVY_TESTFILE);
        });

        it('Open "test.camelk.groovy" file inside Editor View', async function () {
            await openContextInsideEditorView(GROOVY_TESTFILE);
        });

        it('Code completion is working for component schemes (the part before the ":")', async function () {
            await codeCompletionForComponentScheme(GROOVY_URI_LINE, GROOVY_URI_POSITION, 'from(\'timer:timerName\')'); 
        });

        it('Code completion is working for endpoint options (the part after the "?")', async function () {
            await codeCompletionForEndpointOptions(GROOVY_URI_LINE, GROOVY_URI_POSITION, 'from(\'timer:timerName?delay=1000\')');
        });

        it('Code completion is working for additional endpoint options (the part after "&")', async function () {
            await codeCompletionForAdditionalEndpointOptions(GROOVY_URI_LINE, GROOVY_URI_POSITION, false, 'from(\'timer:timerName?delay=1000&exchangePattern=\')');
            await codeCompletionForAdditionalEndpointOptionsValue(GROOVY_URI_LINE, GROOVY_URI_POSITION, false, 'from(\'timer:timerName?delay=1000&exchangePattern=InOnly\')');
        });
	});

	describe('Kotlin DSL support', function () {
		this.timeout(DSL_TIMEOUT);

        before(_setup(KOTLIN_TESTFILE));
        after(_clean(KOTLIN_TESTFILE));
        
        beforeEach(async function () {
            await activateEditor(driver, KOTLIN_TESTFILE);
        });

        it('Open "test.camelk.kts" file inside Editor View', async function () {
            await openContextInsideEditorView(KOTLIN_TESTFILE);
        });

        it('Code completion is working for component schemes (the part before the ":")', async function () {
            await codeCompletionForComponentScheme(KOTLIN_URI_LINE, KOTLIN_URI_POSITION, 'from("timer:timerName")'); 
        });

        it('Code completion is working for endpoint options (the part after the "?")', async function () {
            await codeCompletionForEndpointOptions(KOTLIN_URI_LINE, KOTLIN_URI_POSITION, 'from("timer:timerName?delay=1000")');
        });

        it('Code completion is working for additional endpoint options (the part after "&")', async function () {
            await codeCompletionForAdditionalEndpointOptions(KOTLIN_URI_LINE, KOTLIN_URI_POSITION, false, 'from("timer:timerName?delay=1000&exchangePattern=")');
            await codeCompletionForAdditionalEndpointOptionsValue(KOTLIN_URI_LINE, KOTLIN_URI_POSITION, false, 'from("timer:timerName?delay=1000&exchangePattern=InOnly")');
        });
	});

	describe('JavaScript DSL support', function () {
		this.timeout(DSL_TIMEOUT);

        before(_setup(JS_TESTFILE));
        after(_clean(JS_TESTFILE));
        
        beforeEach(async function () {
            await activateEditor(driver, JS_TESTFILE);
        });

        it('Open "camel.js" file inside Editor View', async function () {
            await openContextInsideEditorView(JS_TESTFILE);
        });

        it('Code completion is working for component schemes (the part before the ":")', async function () {
            await codeCompletionForComponentScheme(JS_URI_LINE, JS_URI_POSITION, 'from(\'timer:timerName\')'); 
        });

        it('Code completion is working for endpoint options (the part after the "?")', async function () {
            await codeCompletionForEndpointOptions(JS_URI_LINE, JS_URI_POSITION, 'from(\'timer:timerName?delay=1000\')');
        });

        it('Code completion is working for additional endpoint options (the part after "&")', async function () {
            await codeCompletionForAdditionalEndpointOptions(JS_URI_LINE, JS_URI_POSITION, false, 'from(\'timer:timerName?delay=1000&exchangePattern=\')');
            await codeCompletionForAdditionalEndpointOptionsValue(JS_URI_LINE, JS_URI_POSITION, false, 'from(\'timer:timerName?delay=1000&exchangePattern=InOnly\')');
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
async function lspDiagnosticSupport(uriLine: number, uriPosition: number): Promise<void> {
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

/**
 * Checks if no item in 'Reference' SideBar is available for selected component in 'camel1.xml'.
 *
 * @param uriLine Line number containing uri.
 * @param uriPosition Position of uri on line.
 */
async function noReferenceAvailable(uriLine: number, uriPosition: number): Promise<void> {
	editor = await activateEditor(driver, REFERENCES_FILE_1);
	await editor.moveCursor(uriLine, uriPosition); // get to position in code
	await new Workbench().executeCommand('references-view.findReferences');
	assert.isFalse(await isReferencesAvailable()); // no reference should be available
}

/**
 * Checks if expected item is available in 'Reference' SideBar.
 * Used files are 'camel1.xml' as main opened file and 'camel2.xml' as file with reference.
 *
 * @param uriLine Line number containing uri.
 * @param uriPosition Position of uri on line.
 * @param expectedReference Expected reference.
 */
async function referenceAvailable(uriLine: number, uriPosition: number, expectedReference: string): Promise<void> {
	await openFileInEditor(driver, RESOURCES_REFERENCES, REFERENCES_FILE_2); // has to be opened

	editor = await activateEditor(driver, REFERENCES_FILE_1); // switch to other file
	assert.isTrue((await editor.getTitle()).startsWith(REFERENCES_FILE_1));
	await editor.moveCursor(uriLine, uriPosition); // get to position in code

	await new Workbench().executeCommand('references-view.findReferences'); // find all references

	// wait until 'References' refreshed
	await driver.wait(async function () {
		return (await isReferencesAvailable());
	}, 15000);

	const section = await new SideBarView().getContent().getSection('References') as DefaultTreeSection;
	const visibleItems = await section.getVisibleItems();
	assert.equal(await visibleItems.at(0).getLabel(), REFERENCES_FILE_2);
	assert.equal(await visibleItems.at(1).getLabel(), expectedReference);
}
