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
import { expect } from 'chai';
import { NewCamelRouteCommand } from '../../commands/NewCamelRouteCommand';
import { waitUntilEditorIsOpened, waitUntilFileIsCreated } from './helper';
import { NewCamelFileCommand } from '../../commands/NewCamelFileCommand';

describe('Should execute Create a Camel Route command', function () {

	let showInputBoxStub: sinon.SinonStub;
	let showQuickPickStub: sinon.SinonStub;
	let createdFile: vscode.Uri;

	const fileName = 'test-route';
	const fileNameWithSpace = 'test route';
	const fullFileName = `${fileName}.camel.yaml`;
	const fullFileNameWithSpace = `${fileNameWithSpace}.camel.yaml`;

	const javaFileName = 'TestRoute';
	const fullJavaFileName = `${javaFileName}.java`;

	const fullXmlFileName = `${fileName}.camel.xml`;

	context('File creation', function () {

		beforeEach(async function () {
			showQuickPickStub = sinon.stub(vscode.window, 'showQuickPick');
			showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
		});

		afterEach(async function () {
			showQuickPickStub.restore();
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
			await initNewFile(fileName, 'YAML DSL');

			createdFile = await waitUntilFileIsCreated(fullFileName);
			expect(createdFile.fsPath).not.to.be.undefined;

			const openedEditor = await waitUntilEditorIsOpened(fullFileName);
			expect(openedEditor).to.be.true;
		});

		it('New Camel Yaml DSL file can be created - name with white space', async function () {
			await initNewFile(fileNameWithSpace, 'YAML DSL');

			createdFile = await waitUntilFileIsCreated(fullFileNameWithSpace);
			expect(createdFile.fsPath).not.to.be.undefined;

			const openedEditor = await waitUntilEditorIsOpened(fullFileNameWithSpace);
			expect(openedEditor).to.be.true;
		});

		it('New Camel Java DSL file can be created', async function () {
			await initNewFile(javaFileName, 'Java DSL');

			createdFile = await waitUntilFileIsCreated(fullJavaFileName);
			expect(createdFile.fsPath).not.to.be.undefined;

			const openedEditor = await waitUntilEditorIsOpened(fullJavaFileName);
			expect(openedEditor).to.be.true;
		});

		it('New Camel Xml DSL file can be created', async function () {
			await initNewFile(fileName, 'XML DSL');

			createdFile = await waitUntilFileIsCreated(fullXmlFileName);
			expect(createdFile.fsPath).not.to.be.undefined;

			const openedEditor = await waitUntilEditorIsOpened(fullXmlFileName);
			expect(openedEditor).to.be.true;
		});

	});

	/**
	 * Camel file name validation
	 *  - no empty name
	 *  - name without extension
	 *  - file already exists check
	 *  - name cannot contains eg. special characters
	 *  - Java naming convention
	 */
	context('File name validation', function () {

		let newCamelRouteCommand: NewCamelRouteCommand;

		context('YAML naming convention', function () {

			before(async function () {
				newCamelRouteCommand = new NewCamelRouteCommand('YAML');
			});

			it('Validate empty name', function () {
				expect(newCamelRouteCommand.validateCamelFileName('')).to.not.be.undefined;
			});

			it('Validate name with space', function () {
				expect(newCamelRouteCommand.validateCamelFileName('name with spaces')).to.be.undefined;
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

		context('JAVA naming convention', function () {

			before(async function () {
				newCamelRouteCommand = new NewCamelRouteCommand('JAVA');
			});

			it('Validate empty name', function () {
				expect(newCamelRouteCommand.validateCamelFileName('')).to.not.be.undefined;
			});

			it('Validate name with space', function () {
				expect(newCamelRouteCommand.validateCamelFileName('Name With Spaces')).to.not.be.undefined;
			});

			it('Validate name without extension', function () {
				expect(newCamelRouteCommand.validateCamelFileName('CamelRoute.java')).to.not.be.undefined;
			});

			it('Validate file already exists', function () {
				expect(newCamelRouteCommand.validateCamelFileName('ModelineCompletion')).to.not.be.undefined;
			});

			it('Validate special characters', function () {
				expect(newCamelRouteCommand.validateCamelFileName('spe<ia|')).to.not.be.undefined;
			});

			it('Validate start with upper case', function () {
				expect(newCamelRouteCommand.validateCamelFileName('camelRoute')).to.not.be.undefined;
			});

		});

	});

	async function initNewFile(name: string, dsl: string): Promise<void> {
		showQuickPickStub.resolves({ label: dsl });
		showInputBoxStub.resolves(name);
		await vscode.commands.executeCommand(NewCamelFileCommand.ID_COMMAND_CAMEL_NEW_FILE);
	}
});
