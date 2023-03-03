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
import * as fs from 'fs';
import { commands, Uri, window, workspace, WorkspaceFolder } from 'vscode';
import { CamelJBangTask } from '../tasks/CamelJBangTask';

import validFilename = require('valid-filename');

export class NewCamelRouteCommand {

	public static ID_COMMAND_CAMEL_ROUTE_JBANG = 'camel.jbang.routes.yaml';
	public static YAML_FILE_EXTENSION = 'camel.yaml';

	private workspaceFolder = this.getWorkspaceFolder();

	public async create(): Promise<void> {
		const input = await this.showInputBox();
		if(input) {
			const fileName = this.getFullName(input, NewCamelRouteCommand.YAML_FILE_EXTENSION);
			const filePath = this.computeFullPath(this.workspaceFolder, fileName);

			await new CamelJBangTask(this.workspaceFolder, fileName).execute();
			await commands.executeCommand('vscode.open', Uri.file(filePath));
		}
	}

	private async showInputBox(): Promise<string> {
		const CAMEL_ROUTE_PLACEHOLDER = 'sample-route';
		return await window.showInputBox({
			prompt: 'Please provide a name for the new file (without extension).',
			placeHolder: CAMEL_ROUTE_PLACEHOLDER,
			validateInput: (fileName) => {
				return this.validateCamelFileName(fileName);
			},
		});
	}

	/**
	 * Camel file name validation
	 * 	- no empty name
	 *  - name without extension
	 *  - file already exists check
	 *  - name cannot contains eg. special characters
	 *
	 * @param name
	 * @returns string | undefined
	 */
	public validateCamelFileName(name: string): string | undefined {
		if (!name) {
			return 'Please provide a name for the new file (without extension).';
		}
		if(name.includes('.')) {
			return 'Please provide a name without the extension.';
		}
		const newFilePotentialFullPath: string = this.computeFullPath(this.workspaceFolder, this.getFullName(name, NewCamelRouteCommand.YAML_FILE_EXTENSION));
		if (fs.existsSync(newFilePotentialFullPath)) {
			return 'The file already exists. Please choose a different file name.';
		}
		if (!validFilename(name)) {
			return 'The filename is invalid.';
		}
		return undefined;
	}

	/**
	 * Get the full file name for provided name and suffix
	 *
	 * @param name of the file
	 * @param suffix of the file
	 * @returns the full file name format [name.suffix] eg. foo.yaml
	 */
	private getFullName(name: string, suffix: string): string {
		return `${name}.${suffix}`;
	}

	/**
	 * Resolves absolute path for the given workspace and file
	 *
	 * @param workspaceFolder
	 * @param file
	 * @returns abosolute string Path
	 */
	private computeFullPath(workspaceFolder: WorkspaceFolder, file: string): string {
		return path.join(workspaceFolder.uri.fsPath, file);
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

}
