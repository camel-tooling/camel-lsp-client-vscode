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

import { assert } from "chai";
import { ActivityBar, DefaultTreeSection, InputBox, QuickPickItem, SideBarView, VSBrowser, WebDriver, Workbench } from "vscode-uitests-tooling";
import { CODE_NAVIGATION_XML, CODE_NAVIGATION_JAVA, RESOURCES, closeEditor, waitUntilEditorIsOpened, waitUntilExtensionIsActivated, activateEditor } from "../utils/testUtils";
import * as pjson from '../../../package.json';
import * as path from 'path';

describe('Code navigation', function () {
	this.timeout(90000);

	let driver: WebDriver;
	let input: InputBox;
	let quickPicks: QuickPickItem[];
	let section: DefaultTreeSection;

	before(async function () {
		this.timeout(40000);

		driver = VSBrowser.instance.driver;

		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);

		await (await new ActivityBar().getViewControl('Explorer')).openView();
		await (await new SideBarView().getContent().getSection('resources')).collapse();

		section = await new SideBarView().getContent().getSection('Outline') as DefaultTreeSection;
		await section.expand();
	});

	after(async function () {
		await section.collapse();
	});

	describe('XML DSL', function () {

		// All available symbols in 'camel-route.xml' with line of occurence.
		const XML_AV_SYMBOLS = [
			['uitest-context', 1],
			['uitest-direct-route', 2],
			['from direct:testName1', 3],
			['to direct:testName2', 4],
			['uitest-directvm-route', 7],
			['from direct-vm:testName1', 8],
			['to direct-vm:testName2', 9]
		];

		beforeEach(async function () {
			await VSBrowser.instance.openResources(path.join(RESOURCES, CODE_NAVIGATION_XML));
			await waitUntilEditorIsOpened(driver, CODE_NAVIGATION_XML);
		});

		afterEach(async function () {
			await closeEditor(CODE_NAVIGATION_XML, false);
		});

		describe('Quickpick \'Go to Symbol in Editor\' navigation', function () {

			it('all symbol proposals are available', async function () {
				await allSymbolsAreAvailableInQuickpickCommand(XML_AV_SYMBOLS);
			});

			it('goto symbols', async function () {
				await gotoSymbolsUsingQuickpickCommand(XML_AV_SYMBOLS, CODE_NAVIGATION_XML);
			});
		});

		describe('Outline Side Bar navigation', function () {

			it('all symbol proposals are available', async function () {
				await allSymbolsAreAvailableInOutlineSideBar(XML_AV_SYMBOLS);
			});

			it('goto symbols', async function () {
				await gotoSymbolsUsingOutlineSideBar(XML_AV_SYMBOLS, CODE_NAVIGATION_XML);
			});
		});
	});

	/**
	 * Skipping on Windows.
	 * https://issues.redhat.com/browse/FUSETOOLS2-2155
	 */
	(process.platform === 'win32' ? describe.skip : describe)('Java DSL', function () {

		const JAVA_AV_SYMBOLS = [
			['from timer:java', 7],
			['setBody', 8],
			['log', 10],
			['from timer:java2', 12],
			['setHeader', 13],
			['to log:info', 15]
		];

		beforeEach(async function () {
			await VSBrowser.instance.openResources(path.join(RESOURCES, CODE_NAVIGATION_JAVA));
			await waitUntilEditorIsOpened(driver, CODE_NAVIGATION_JAVA);
		});

		afterEach(async function () {
			await closeEditor(CODE_NAVIGATION_JAVA, false);
		});

		describe('Quickpick \'Go to Symbol in Editor\' navigation', function () {

			it('all symbol proposals are available', async function () {
				await allSymbolsAreAvailableInQuickpickCommand(JAVA_AV_SYMBOLS);
			});

			it('goto symbols', async function () {
				await gotoSymbolsUsingQuickpickCommand(JAVA_AV_SYMBOLS, CODE_NAVIGATION_JAVA);
			});
		});

		describe('Outline Side Bar navigation', function () {

			it('all symbol proposals are available', async function () {
				await allSymbolsAreAvailableInOutlineSideBar(JAVA_AV_SYMBOLS);
			});

			it('goto symbols', async function () {
				await gotoSymbolsUsingQuickpickCommand(JAVA_AV_SYMBOLS, CODE_NAVIGATION_JAVA);
			});
		});
	});

	/**
	 * Check if all symbols are available in Quick Pick command.
	 *
	 * @param listOfAvailableSymbols List of expected symbols with line number of occurence.
	 */
	async function allSymbolsAreAvailableInQuickpickCommand(listOfAvailableSymbols: (string | number)[][]): Promise<void> {
		await new Workbench().executeCommand('workbench.action.gotoSymbol');

		await driver.wait(async function () {
			input = await InputBox.create();
			return (await input.isDisplayed());
		}, 30000);

		quickPicks = await input.getQuickPicks();
		for (const quickpick of quickPicks) {
			// Check if quickpick.getIndex() and listOfAvailableSymbols[quickpick.getIndex()] are defined
			const nameFromField = listOfAvailableSymbols[quickpick.getIndex()]?.[0];
			if (nameFromField !== undefined) {
				assert.equal((await quickpick.getLabel()).slice(1), nameFromField);
			} else {
				// Handle the case where the index is out of range or listOfAvailableSymbols is undefined
				console.error(`Unable to retrieve name from field for index ${quickpick.getIndex()}`);
			}
		}

		await input.cancel();
	}


	/**
	 * Check if all symbols references are working in Quick Pick command.
	 *
	 * @param listOfAvailableSymbols List of expected symbols with line number of occurence.
	 */
	async function gotoSymbolsUsingQuickpickCommand(listOfAvailableSymbols: (string | number)[][], title: string): Promise<void> {
		for (const quickpick of quickPicks) {
			const index = quickpick.getIndex();
			if (index !== undefined && index < listOfAvailableSymbols.length) {
				const symbol = listOfAvailableSymbols[index][0] as string;
				await selectSymbolFromProposals(symbol);
				const editor = await activateEditor(driver, title);
				const coords = (await editor.getCoordinates())[0]; // get active line in editor
				if (coords === undefined) {
					throw new Error("Unable to get coordinates from the editor.");
				}
				const expectedLineNumber = listOfAvailableSymbols[index][1] as number;
				assert.equal(coords, expectedLineNumber);
			} else {
				throw new Error("Invalid index or index out of range.");
			}
		}
	}

	/**
	 * Check if all symbols are available in Outline side bar.
	 *
	 * @param listOfAvailableSymbols List of expected symbols with line number of occurence.
	 */
	async function allSymbolsAreAvailableInOutlineSideBar(listOfAvailableSymbols: (string | number)[][]): Promise<void> {
		const actions = await section.getVisibleItems();
		for (let i = 0; i < actions.length; i++) {
			const fromSidebar = (await actions.at(i)?.getLabel()) ?? undefined;
			const nameFromField = listOfAvailableSymbols[i]?.[0];
			if (fromSidebar !== undefined && nameFromField !== undefined) {
				assert.equal(fromSidebar, nameFromField);
			} else {
				throw new Error(`Undefined value found at index ${i}`);
			}
		}
	}

	/**
	 * Check if all symbols references are working in Outline side bar.
	 *
	 * @param listOfAvailableSymbols List of expected symbols with line number of occurrence.
	 */
	async function gotoSymbolsUsingOutlineSideBar(listOfAvailableSymbols: (string | number)[][], title: string): Promise<void> {
		for (const symbol of listOfAvailableSymbols) {
			const label = symbol.at(0) as string;
			const labelCoord = +symbol.at(1);
			await (await section.findItem(label)).click();
			await section.getDriver().wait(async function () {
				const item = await section.findItem(label);
				return item !== undefined && await item.getAttribute('aria-selected') === 'true';
			}, 5_000);
			const editor = await activateEditor(driver, title);
			const coords = (await editor.getCoordinates()).at(0);

			assert.equal(coords, labelCoord,
				`Clicked on symbol on outline sidebar ${label}.
			The current expected text to be clicked on is: ${label}.
			It is expected to have line on editor selected: ${labelCoord}
			The currently selected line is ${coords}`);
		}
	}

	/**
	 * Select specific symbol from proposals in 'Go to Symbol in Editor...' from quickpicks.
	 *
	 * @param proposal Required symbol for selction.
	 */
	async function selectSymbolFromProposals(proposal: string): Promise<void> {
		let input: InputBox | undefined;

		await new Workbench().executeCommand('workbench.action.gotoSymbol'); // 'Go to Symbol in Editor...'

		await driver.wait(async function () {
			input = await InputBox.create();
			return (await input.isDisplayed());
		}, 30000);

		if (input !== undefined) {
			const symbols = await input.getQuickPicks();
			for (const symbol of symbols) {
				const label = (await symbol.getLabel()).slice(1);
				if (label === proposal) {
					await symbol.select();
				}
			}
		}
	}
});
