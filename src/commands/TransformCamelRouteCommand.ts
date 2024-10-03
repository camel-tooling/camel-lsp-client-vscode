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

import * as path from 'path';
import { commands, Uri, window } from 'vscode';
import { CamelTransformRouteJBangTask } from '../tasks/CamelTransformRouteJBangTask';
import { AbstractTransformCamelRouteCommand } from './AbstractTransformCamelRouteCommand';

export class TransformCamelRouteCommand extends AbstractTransformCamelRouteCommand {

	public static readonly ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTE_TO_YAML = 'camel.jbang.transform.route.yaml';
	public static readonly ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTE_TO_XML = 'camel.jbang.transform.route.xml';

	protected fileNameInputPrompt = 'Please provide a name for the new transformed Camel Route.';

	public async create(uri?: Uri): Promise<void> {

		// If an Uri was passed use it otherwise defaults to the file in the active editor
		const selectedUri = uri ?? (window.activeTextEditor ? window.activeTextEditor.document.uri : undefined);

		if (!selectedUri) {
			await window.showErrorMessage('No file or folder selected.');
			return;
		}

		const currentOpenedFileUri = selectedUri;
		const currentOpenedFileDir = path.parse(currentOpenedFileUri.fsPath).dir;
		const currentOpenedFileName = path.parse(currentOpenedFileUri.fsPath).name;
		const input = await this.showInputBoxForFileName(currentOpenedFileName, currentOpenedFileDir);

		if (input && this.camelDSL && this.workspaceFolder) {
			const transformedRouteFileName = input + `.${this.camelDSL.extension}`;

			if (transformedRouteFileName) {
				const transformedRouteFilePath = path.join(currentOpenedFileDir, transformedRouteFileName);
				const format = this.camelDSL.language;
				await new CamelTransformRouteJBangTask(this.workspaceFolder, currentOpenedFileUri.fsPath, format, transformedRouteFilePath).execute();
				await commands.executeCommand('vscode.open', Uri.file(transformedRouteFilePath));
			}
		}

	}

	protected async showInputBoxForFileName(placeHolder: string, folderPath: string): Promise<string> {
		const output = await window.showInputBox({
			prompt: this.fileNameInputPrompt,
			placeHolder: placeHolder,
			validateInput: (fileName) => {
				return this.validateCamelFileName(fileName, folderPath);
			},
		});

		if (output === undefined) {
			return '';
		}

		return output;
	}

}
