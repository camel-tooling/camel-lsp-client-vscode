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
import validFilename from 'valid-filename';
import { commands, Uri, window } from 'vscode';
import { CamelTransformRouteJBangTask } from '../tasks/CamelTransformRouteJBangTask';
import { AbstractTransformCamelRouteCommand } from './AbstractTransformCamelRouteCommand';

export class TransformCamelRouteCommand extends AbstractTransformCamelRouteCommand{

	public static readonly ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTE_TO_YAML = 'camel.jbang.transform.route.yaml';
	public static readonly ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTE_TO_XML = 'camel.jbang.transform.route.xml';

	protected fileNameInputPrompt = 'Please provide a name for the new transformed Camel Route.';

	public async create(): Promise<void> {

		if (window.activeTextEditor) {
			const currentOpenedFileUri = window.activeTextEditor.document.uri;
			const currentOpenedFileDir = path.parse(currentOpenedFileUri.fsPath).dir;
			const currentOpenedFileName = path.parse(currentOpenedFileUri.fsPath).name;
			const transformedRouteFileName = await this.showInputBoxForFileName(currentOpenedFileName + '.camel.yaml');
		
			if (transformedRouteFileName) {
				const transformedRouteFilePath = path.join(currentOpenedFileDir, transformedRouteFileName);
				if (this.workspaceFolder){
					const format = this.camelDSL?.language ?? 'Yaml'; //Defaults to Yaml
					await new CamelTransformRouteJBangTask(this.workspaceFolder, currentOpenedFileUri.fsPath, format, transformedRouteFilePath).execute();
					await commands.executeCommand('vscode.open', Uri.file(transformedRouteFilePath));
				}
			}
		}
	}

	protected async showInputBoxForFileName(placeHolder: string): Promise<string> {
		const output = await window.showInputBox({
			prompt: this.fileNameInputPrompt,
			placeHolder: placeHolder,
			validateInput: (fileName) => {
				return this.validateFileName(fileName);
			},
		});

		if (output === undefined) {
			return '';
		}

		return output;
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
