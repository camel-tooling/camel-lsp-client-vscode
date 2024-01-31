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

import { QuickPickItem, commands, window } from "vscode";
import { NewCamelRouteCommand } from "./NewCamelRouteCommand";
import { NewCamelRouteFromOpenAPICommand } from "./NewCamelRouteFromOpenAPICommand";
import { NewCamelKameletCommand } from "./NewCamelKameletCommand";

export class NewCamelFileCommand {

	public static readonly ID_COMMAND_CAMEL_NEW_FILE = 'camel.new.file';

	public async create(): Promise<void> {
		const selection = await this.showQuickPickForCamelFileType();
		if (selection) {
			const cmd = this.getCamelRouteCommandFromSelection(selection.label);
			await commands.executeCommand(cmd);
		}
	}

	protected async showQuickPickForCamelFileType(): Promise<QuickPickItem> {
		const items: QuickPickItem[] = [
			{ label: 'YAML DSL', description: 'Camel Route using YAML DSL' },
			{ label: 'Java DSL', description: 'Camel Route using Java DSL' },
			{ label: 'XML DSL', description: 'Camel Route using XML DSL' },
			{ label: 'YAML DSL from OpenAPI', description: 'Camel Route from OpenAPI using YAML DSL' },
			{ label: 'Kamelet', description: 'Kamelet using YAML DSL' },
		]
		return await window.showQuickPick(items, {
			placeHolder: 'Please select a Camel File type.',
			title: 'New Camel File...'
		});
	}

	protected getCamelRouteCommandFromSelection(selection: string): string | undefined {
		switch (selection) {
			case 'YAML DSL':
				return NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_YAML;
			case 'Java DSL':
				return NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_JAVA;
			case 'XML DSL':
				return NewCamelRouteCommand.ID_COMMAND_CAMEL_ROUTE_JBANG_XML;
			case 'YAML DSL from OpenAPI':
				return NewCamelRouteFromOpenAPICommand.ID_COMMAND_CAMEL_ROUTE_FROM_OPEN_API_JBANG_YAML;
			case 'Kamelet':
				return NewCamelKameletCommand.ID_COMMAND_CAMEL_ROUTE_KAMELET_YAML;
			default:
				break;
		}
		return undefined;
	}
}
