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

import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { expect } from 'chai';
import { cleanCreatedFileAfterEachCommandExec, waitUntilEditorIsOpened, waitUntilFileIsCreated } from './helper';
import path from 'path';
import { NewCamelRouteFromOpenAPICommand } from '../../commands/NewCamelRouteFromOpenAPICommand';

describe('Should execute Create a route from open api command', function () {

	let showOpenDialogStub: sinon.SinonStub;
	let showInputBoxStub: sinon.SinonStub;
	let createdFile: vscode.Uri;

	context('Using Yaml DSL', function () {
		const fileName = 'test';
		const fullFileName = `${fileName}.camel.yaml`;

		beforeEach(async function () {
			this.timeout(200000);
			showOpenDialogStub = sinon.stub(vscode.window, 'showOpenDialog');
			showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
		});

		afterEach(async function () {
			showOpenDialogStub.restore();
			showInputBoxStub.restore();
			await cleanCreatedFileAfterEachCommandExec(createdFile);
		});

		after(async function () {
			await vscode.commands.executeCommand('workbench.action.closePanel');
		});

		it('New file can be created', async function () {
			await initNewFile(fileName);

			const createdFile = await waitUntilFileIsCreated(fullFileName);
			expect(createdFile.fsPath).not.to.be.undefined;

			const openedEditor = await waitUntilEditorIsOpened(fullFileName);
			expect(openedEditor).to.be.true;
			const workspaceFolder :vscode.WorkspaceFolder = vscode.workspace.workspaceFolders![0];
			expect(vscode.window.activeTextEditor?.document.uri.fsPath).to.be.equal(path.join(workspaceFolder.uri.fsPath, fullFileName));
		});

		it('New file can be created - in subfolder', async function () {
			const workspaceFolder :vscode.WorkspaceFolder = vscode.workspace.workspaceFolders![0];
			await initNewFile(fileName, vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'a sub folder')));

			const createdFile = await waitUntilFileIsCreated(fullFileName);
			expect(createdFile.fsPath).not.to.be.undefined;

			const openedEditor = await waitUntilEditorIsOpened(fullFileName);
			expect(openedEditor).to.be.true;
			expect(vscode.window.activeTextEditor?.document.uri.fsPath).to.be.equal(path.join(workspaceFolder.uri.fsPath, 'a sub folder', fullFileName));
		});
	});

	async function initNewFile(name: string, targetFolder?: vscode.Uri): Promise<void> {
		const workspaceFolder :vscode.WorkspaceFolder = vscode.workspace.workspaceFolders![0];
		console.log(path.join(workspaceFolder.uri.fsPath, 'petstore.json'));
		showOpenDialogStub.resolves([vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'petstore.json'))]);
		showInputBoxStub.resolves(name);
		await vscode.commands.executeCommand(NewCamelRouteFromOpenAPICommand.ID_COMMAND_CAMEL_ROUTE_FROM_OPEN_API_JBANG_YAML, targetFolder);
	}
});
