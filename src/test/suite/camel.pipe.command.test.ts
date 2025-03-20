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
import { NewCamelFileCommand } from '../../commands/NewCamelFileCommand';
import path from 'path';

describe('Should execute Create a Pipe command', function () {

	let showQuickPickStub: sinon.SinonStub;
	let showInputBoxStub: sinon.SinonStub;
	let createdFile: vscode.Uri;

	context('using YAML DSL', function () {
		const fileName = 'test';
		const fullFileName = `${fileName}-pipe.yaml`;

		beforeEach(async function () {
			showQuickPickStub = sinon.stub(vscode.window, 'showQuickPick');
			showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
		});

		afterEach(async function () {
			showQuickPickStub.restore();
			showInputBoxStub.restore();
			await cleanCreatedFileAfterEachCommandExec(createdFile);
		});

		after(async function () {
			await vscode.commands.executeCommand('workbench.action.closePanel');
		});

		it('New file can be created', async function () {
			await initNewFile(fileName);

			const createdFile = await waitUntilFileIsCreated(fullFileName, 10_000);
			expect(createdFile.fsPath).not.to.be.undefined;

			const openedEditor = await waitUntilEditorIsOpened(fullFileName);
			expect(openedEditor).to.be.true;
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
		showQuickPickStub.resolves({ label: 'Pipe' });
		showInputBoxStub.resolves(name);
		await vscode.commands.executeCommand(NewCamelFileCommand.ID_COMMAND_CAMEL_NEW_FILE, targetFolder);
	}
});
