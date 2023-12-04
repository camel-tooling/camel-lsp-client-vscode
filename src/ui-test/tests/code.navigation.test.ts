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
		const XML_av_symbols = [
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
				await allSymbolsAreAvailableInQuickpickCommand(XML_av_symbols);
			});

			it('goto symbols', async function () {
				await gotoSymbolsUsingQuickpickCommand(XML_av_symbols, CODE_NAVIGATION_XML);
			});
		});

		describe('Outline Side Bar navigation', function () {

			it('all symbol proposals are available', async function () {
				await allSymbolsAreAvailableInOutlineSideBar(XML_av_symbols);
			});

			it('goto symbols', async function () {
				await gotoSymbolsUsingOutlineSideBar(XML_av_symbols);
			});
		});
	});

	/**
	 * Skipping on Windows.
	 * https://issues.redhat.com/browse/FUSETOOLS2-2155
	 */
	(process.platform === 'win32' ? describe.skip : describe)('Java DSL', function () {

		const JAVA_av_symbols = [
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
				await allSymbolsAreAvailableInQuickpickCommand(JAVA_av_symbols);
			});

			it('goto symbols', async function () {
				await gotoSymbolsUsingQuickpickCommand(JAVA_av_symbols, CODE_NAVIGATION_JAVA);
			});
		});

		describe('Outline Side Bar navigation', function () {

			it('all symbol proposals are available', async function () {
				await allSymbolsAreAvailableInOutlineSideBar(JAVA_av_symbols);
			});

			it('goto symbols', async function () {
				await gotoSymbolsUsingQuickpickCommand(JAVA_av_symbols, CODE_NAVIGATION_JAVA);
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
			const nameFromField = listOfAvailableSymbols.at(quickpick.getIndex()).at(0);
			assert.equal((await quickpick.getLabel()).slice(1), nameFromField);
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
			await selectSymbolFromProposals(listOfAvailableSymbols.at(quickpick.getIndex()).at(0) as string);
			const editor = await activateEditor(driver, title);
			const coords = (await editor.getCoordinates()).at(0); // get active line in editor
			assert.equal(coords, listOfAvailableSymbols.at(quickpick.getIndex()).at(1));
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
			const fromSidebar = await actions.at(i).getLabel();
			const nameFromField = listOfAvailableSymbols.at(i).at(0);
			assert.equal(fromSidebar, nameFromField);
		}
	}

	/**
	 * Check if all symbols references are working in Outline side bar.
	 *
	 * @param listOfAvailableSymbols List of expected symbols with line number of occurence.
	 */
	async function gotoSymbolsUsingOutlineSideBar(listOfAvailableSymbols: (string | number)[][]): Promise<void> {
		const actions = await section.getVisibleItems();
		for (let i = 0; i < actions.length; i++) {
			await actions.at(i).click();
			const editor = await activateEditor(driver, CODE_NAVIGATION_XML);
			const coords = (await editor.getCoordinates()).at(0);
			assert.equal(listOfAvailableSymbols.at(i).at(1), coords);
		}
	}

	/**
	 * Select specific symbol from proposals in 'Go to Symbol in Editor...' from quickpicks.
	 *
	 * @param proposal Required symbol for selction.
	 */
	async function selectSymbolFromProposals(proposal: string): Promise<void> {
		let input: InputBox;

		await new Workbench().executeCommand('workbench.action.gotoSymbol'); // 'Go to Symbol in Editor...'

		await driver.wait(async function () {
			input = await InputBox.create();
			return (await input.isDisplayed());
		}, 30000);

		const symbols = await input.getQuickPicks();
		for (const symbol of symbols) {
			const label = (await symbol.getLabel()).slice(1);
			if (label === proposal) {
				await symbol.select();
			}
		}
	}
});
