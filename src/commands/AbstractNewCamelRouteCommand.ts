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

import { WorkspaceFolder, window } from "vscode";
import * as fs from 'fs';
import validFilename = require("valid-filename");
import path = require("path");
import { AbstractCamelCommand } from "./AbstractCamelCommand";

export abstract class AbstractNewCamelRouteCommand extends AbstractCamelCommand{

	protected fileNameInputPrompt = 'Please provide a name for the new file (without extension).';

	protected async showInputBoxForFileName(): Promise<string> {
		const input = await window.showInputBox({
			prompt: this.fileNameInputPrompt,
			placeHolder: this.camelDSL?.placeHolder ?? '',
			validateInput: (fileName) => {
				return this.validateCamelFileName(fileName ?? '');
			},
		});

		return input ?? '';
	}

	/**
	 * Camel file name validation
	 *  - no empty name
	 *  - name without extension
	 *  - file already exists check
	 *  - name cannot contains eg. special characters
	 *  - Java pattern naming convention \b[A-Z][a-zA-Z_$0-9]*
	 *
	 * @param name
	 * @returns string | undefined
	 */
	public validateCamelFileName(name: string): string | undefined {
		if (!name) {
			return 'Please provide a name for the new file (without extension).';
		}

		if (name.includes('.')) {
			return 'Please provide a name without the extension.';
		}

		if (!this.camelDSL) {
			return 'Internal error: Camel DSL is undefined.'; // camelDSL can't be undefined
		}

		if (!this.workspaceFolder) {
			return 'Internal error: Workspace folder is undefined.';
		}

		const newFilePotentialFullPath: string = this.computeFullPath(this.workspaceFolder, this.getFullName(name, this.camelDSL.extension));

		if (fs.existsSync(newFilePotentialFullPath)) {
			return 'The file already exists. Please choose a different file name.';
		}
		if (!validFilename(name)) {
			return 'The filename is invalid.';
		}

		const patternJavaNamingConvention = '\\b[A-Z][a-zA-Z_$0-9]*';
		if ((this.camelDSL.language === 'Java') && (!name.match(patternJavaNamingConvention) || name.includes(' '))) {
			return `The filename needs to follow the ${this.camelDSL.language} naming convention. I.e. ${patternJavaNamingConvention}`;
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
	protected getFullName(name: string, suffix: string): string {
		return `${name}.${suffix}`;
	}

	/**
	 * Resolves absolute path for the given workspace and file
	 *
	 * @param workspaceFolder
	 * @param file
	 * @returns abosolute string Path
	 */
	protected computeFullPath(workspaceFolder: WorkspaceFolder, file: string): string {
		return path.join(workspaceFolder.uri.fsPath, file);
	}

}
