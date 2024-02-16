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
'use strict'

import * as path from 'path';
import * as validFilename from 'valid-filename';
import { commands, Uri, window, workspace, WorkspaceFolder } from 'vscode';
import { CamelTransformRouteToYAMLJBangTask } from '../tasks/CamelTransformRouteToYAMLJBangTask';


export class TransformCamelRouteToYAMLCommand {

	public static ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTE_TO_YAML = 'camel.jbang.transform.route.yaml';

	protected workspaceFolder: WorkspaceFolder | undefined;
	protected fileNameInputPrompt = 'Please provide a name for the new transformed Camel Route.';

	constructor() {
		this.workspaceFolder = this.getWorkspaceFolder();
	}

	public async create(): Promise<void> {

		const currentOpenedFileUri = window.activeTextEditor.document.uri;
		const currentOpenedFileDir = path.parse(currentOpenedFileUri.fsPath).dir;
		const currentOpenedFileName = path.parse(currentOpenedFileUri.fsPath).name;
		const transformedRouteFileName = await this.showInputBoxForFileName(currentOpenedFileName + '.yaml');


		if (transformedRouteFileName) {

			const transformedRouteFilePath = path.join(currentOpenedFileDir, transformedRouteFileName);
			await new CamelTransformRouteToYAMLJBangTask(this.workspaceFolder, currentOpenedFileUri.fsPath, transformedRouteFilePath).execute();
			await commands.executeCommand('vscode.open', Uri.file(transformedRouteFilePath));
		}
	}

	/**
	 * Resolves first opened folder in vscode existing workspace
	 *
	 * @returns WorkspaceFolder object
	 */
	private getWorkspaceFolder(): WorkspaceFolder {
		let workspaceFolder: WorkspaceFolder | undefined;
		if (workspace.workspaceFolders) {
			// default to root workspace folder
			workspaceFolder = workspace.workspaceFolders[0];
		}
		return workspaceFolder;
	}

	protected async showInputBoxForFileName(placeHolder: string): Promise<string> {
		return await window.showInputBox({
			prompt: this.fileNameInputPrompt,
			placeHolder: placeHolder,
			validateInput: (fileName) => {
				return this.validateFileName(fileName);
			},
		});
	}

	/**
	 * File name validation
	 *  - no empty name
	 *  - no name without extension
	 *  - name cannot contains eg. special characters
	 *
	 * @param name
	 * @returns string | undefined
	 */
	public validateFileName(name: string): string | undefined {
		if (!name) {
			return 'Please provide a name for the new file.';
		}
		if (!name.includes('.')) {
			return 'Please provide a name with an extension.';
		}
		if (!validFilename(name)) {
			return 'The filename is invalid.';
		}
		return undefined;
	}

}
