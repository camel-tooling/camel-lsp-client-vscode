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

import { QuickPickItem, Uri, commands, window } from "vscode";
import { AbstractNewCamelRouteCommand } from "./AbstractNewCamelRouteCommand";
import { CamelInitJBangTask } from "../tasks/CamelInitJBangTask";
import { CamelRouteDSL } from "./AbstractCamelCommand";

export class NewCamelKameletCommand extends AbstractNewCamelRouteCommand {

	public static readonly ID_COMMAND_CAMEL_ROUTE_KAMELET_YAML = 'camel.jbang.routes.kamelet.yaml';

	private kameletType: string = '';

	public async create(): Promise<void> {
		const type = await this.showQuickPickForKameletType();

		if (type && this.camelDSL && this.workspaceFolder) {
			this.kameletType = type;
			const name = await this.showInputBoxForFileName();
			if (name) {
				const fileName = this.getKameletFullName(name, type, this.camelDSL.extension);
				const filePath = this.computeFullPath(this.workspaceFolder.uri.fsPath, fileName);

				await new CamelInitJBangTask(this.workspaceFolder, fileName).execute();
				await commands.executeCommand('vscode.open', Uri.file(filePath));
			}
		}
	}

	protected getDSL(dsl: string): CamelRouteDSL | undefined {
		if (dsl === 'YAML') {
			return { language: 'Yaml', extension: 'kamelet.yaml', placeHolder: 'example' };
		} else {
			return undefined;
		}
	}

	protected async showInputBoxForFileName(): Promise<string> {
		return await window.showInputBox({
			prompt: this.fileNameInputPrompt,
			placeHolder: this.camelDSL?.placeHolder,
			validateInput: (fileName) => {
				return this.validateCamelFileName(`${fileName}-${this.kameletType}`);
			},
		}) ?? '';
	}

	protected async showQuickPickForKameletType(): Promise<string> {
		const items: QuickPickItem[] = [
			{ label: 'source', description: 'A route that produces data.', detail: 'You use a source Kamelet to retrieve data from a component.', },
			{ label: 'sink', description: 'A route that consumes data.', detail: 'You use a sink Kamelet to send data to a component.' },
			{ label: 'action', description: 'A route that performs an action on data.', detail: 'You can use an action Kamelet to manipulate data when it passes from a source Kamelet to a sink Kamelet.' }
		];
		const result = await window.showQuickPick(items, {
			placeHolder: 'Please select a Kamelet type.',
		});
		if (result === undefined) {
			return 'Internal error: Try again.';
		}
		return result.label;
	}

	protected getKameletFullName(name: string, type: string, suffix: string): string {
		return `${name}-${type}.${suffix}`;
	}
}
