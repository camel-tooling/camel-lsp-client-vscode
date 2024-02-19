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

import { Uri, commands, window } from "vscode";
import { AbstractNewCamelRouteCommand, CamelRouteDSL } from "./AbstractNewCamelRouteCommand";
import { CamelBindJBangTask } from "../tasks/CamelBindJBangTask";

export class NewCamelPipeCommand extends AbstractNewCamelRouteCommand {

	public static readonly ID_COMMAND_CAMEL_ROUTE_PIPE_YAML = 'camel.jbang.routes.pipe.yaml';

	public async create(): Promise<void> {
		const name = await this.showInputBoxForFileName();
		if (name && this.camelDSL && this.workspaceFolder) {
			const fileName = this.getPipeFullName(name, this.camelDSL.extension);
			const filePath = this.computeFullPath(this.workspaceFolder, fileName);

			await new CamelBindJBangTask(this.workspaceFolder, fileName).execute();
			await commands.executeCommand('vscode.open', Uri.file(filePath));
		}
	}

	protected getDSL(dsl: string): CamelRouteDSL | undefined {
		if (dsl === 'YAML') {
			return { language: 'Yaml', extension: 'yaml', placeHolder: 'example' };
		} else {
			return undefined;
		}
	}

	protected async showInputBoxForFileName(): Promise<string> {
		return await window.showInputBox({
			prompt: this.fileNameInputPrompt,
			placeHolder: this.camelDSL?.placeHolder,
			validateInput: (fileName) => {
				return this.validateCamelFileName(`${fileName}-pipe`);
			},
		}) || '';
	}

	protected getPipeFullName(name: string, suffix: string): string {
		return `${name}-pipe.${suffix}`;
	}
}
