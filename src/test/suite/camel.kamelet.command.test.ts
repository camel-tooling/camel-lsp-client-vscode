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
import { NewCamelKameletCommand } from '../../commands/NewCamelKameletCommand';
import { waitUntilEditorIsOpened, waitUntilFileIsCreated } from './helper';

describe('Should execute Create a Kamelet command', function () {

	let showQuickPickStub: sinon.SinonStub;
	let showInputBoxStub: sinon.SinonStub;
	let createdFile: vscode.Uri;

	const params = [{ type: 'sink' }, { type: 'source' }, { type: 'action' }];

	params.forEach(function (param) {
		context(`using YAML DSL - ${param.type}`, function () {
			const fileName = 'test';
			const fullFileName = `${fileName}-${param.type}.kamelet.yaml`;

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

			it('New file can be created', async function () {
				await initNewFile(fileName, param.type);

				const createdFile = await waitUntilFileIsCreated(fullFileName);
				expect(createdFile.fsPath).not.to.be.undefined;

				const openedEditor = await waitUntilEditorIsOpened(fullFileName);
				expect(openedEditor).to.be.true;
			});
		});
	});

	async function initNewFile(name: string, type: string): Promise<void> {
		showQuickPickStub.resolves({ label: `${type}` });
		showInputBoxStub.resolves(name);
		await vscode.commands.executeCommand(NewCamelKameletCommand.ID_COMMAND_CAMEL_ROUTE_KAMELET_YAML);
	}
});
