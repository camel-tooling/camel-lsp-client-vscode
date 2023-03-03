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
'use strict';

import * as fs from 'fs';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { waitUntil } from 'async-wait-until';
import { assert, expect } from 'chai';
import { NewCamelRouteCommand } from '../commands/NewCamelRouteCommand';

describe('Should execute Camel Route Yaml DSL command', function () {

	let showInputBoxStub: sinon.SinonStub;
	let createdFile: vscode.Uri;

	const fileName = 'test-route';
	const fileNameWithSpace = 'test route';
	const fullFileName = `${fileName}.${NewCamelRouteCommand.YAML_FILE_EXTENSION}`;
	const fullFileNameWithSpace = `${fileNameWithSpace}.${NewCamelRouteCommand.YAML_FILE_EXTENSION}`;

	context('File creation', function () {

		beforeEach(async function () {
			showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
		});

		afterEach(async function () {
			showInputBoxStub.restore();
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			await vscode.commands.executeCommand('workbench.action.terminal.clear');
			if (createdFile && fs.existsSync(createdFile.fsPath)) {
				fs.unlinkSync(createdFile.fsPath);
			}
		});

		after(async function () {
			await vscode.commands.executeCommand('workbench.action.closePanel');
		});

		it('New Camel Yaml DSL file can be created', async function () {
			await initNewFile(fileName);

			await waitUntilFileIsCreated(fullFileName);
			expect(createdFile.fsPath).not.to.be.undefined;

			const openedEditor = await waitUntilEditorIsOpened(fullFileName);
			// static sloweness to allow see the opened editor of created file when looking into tests locally
			await new Promise(resolve => setTimeout(resolve, 1000));
			expect(openedEditor).to.be.true;
		});

		it('New Camel Yaml DSL file can be created - name with white space', async function () {
			await initNewFile(fileNameWithSpace);

			await waitUntilFileIsCreated(fullFileNameWithSpace);
			expect(createdFile.fsPath).not.to.be.undefined;

			const openedEditor = await waitUntilEditorIsOpened(fullFileNameWithSpace);
			// static sloweness to allow see the opened editor of created file when looking into tests locally
			await new Promise(resolve => setTimeout(resolve, 1000));
			expect(openedEditor).to.be.true;
		});

	});

	/**
	 * Camel file name validation
	 *  - no empty name
	 *  - name without extension
	 *  - file already exists check
	 *  - name cannot contains eg. special characters
	 */
	context('File name validation', function () {

		let newCamelRouteCommand: NewCamelRouteCommand;

		before(async function () {
			newCamelRouteCommand = new NewCamelRouteCommand();
		});

		it('Validate empty name', function () {
			expect(newCamelRouteCommand.validateCamelFileName('')).to.not.be.undefined;
		});

		it('Validate name without extension', function () {
			expect(newCamelRouteCommand.validateCamelFileName('name-with-extension.yaml')).to.not.be.undefined;
		});

		it('Validate file already exists', function () {
			expect(newCamelRouteCommand.validateCamelFileName('jbangInitRoute')).to.not.be.undefined;
		});

		it('Validate special characters', function () {
			expect(newCamelRouteCommand.validateCamelFileName('spe<ia|')).to.not.be.undefined;
		});

	});

	async function initNewFile(name: string): Promise<void> {
		showInputBoxStub.resolves(name);
		await vscode.commands.executeCommand(NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG);
	}

	async function waitUntilFileIsCreated(expectedFileNameWithExtension: string): Promise<void> {
		let files: vscode.Uri[] = [];
		await waitUntil(async function () {
			await vscode.workspace.findFiles(expectedFileNameWithExtension).then(res => {
				files = res;
			});
			if (files.length === 1) {
				createdFile = files[0];
				return true;
			}
			console.log(`Waiting for file '${expectedFileNameWithExtension}' to be created...`);
			return false;
		}, 30000).catch(function () {
			assert.fail(`File with expected name '${expectedFileNameWithExtension}' not found in the workspace when calling command to create a new Camel route Yaml DSL using JBang.`);
		});
	}

	async function waitUntilEditorIsOpened(expectedFileNameWithExtension: string): Promise<boolean> {
		return await waitUntil(function () {
			return vscode.window.activeTextEditor?.document.fileName.endsWith(expectedFileNameWithExtension);
		}, 5000);
	}

});
