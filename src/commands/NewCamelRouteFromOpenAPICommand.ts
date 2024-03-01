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

import { Uri, commands, window } from "vscode";
import { AbstractNewCamelRouteCommand } from "./AbstractNewCamelRouteCommand";
import { CamelOpenAPIJBangTask } from "../tasks/CamelOpenAPIJBangTask";

export class NewCamelRouteFromOpenAPICommand extends AbstractNewCamelRouteCommand {

	public static ID_COMMAND_CAMEL_ROUTE_FROM_OPEN_API_JBANG_YAML = 'camel.jbang.routes.yaml.fromopenapi';

	public async create(): Promise<void> {
		const routeFileName = await this.showInputBoxForFileName();
		if (routeFileName && this.camelDSL && this.workspaceFolder) {
			const fileName = this.getFullName(routeFileName, this.camelDSL.extension);
			const filePath = this.computeFullPath(this.workspaceFolder, fileName);

			const openAPIfilePath = await this.showDialogToPickOpenAPIFile();
			if (openAPIfilePath) {
				await new CamelOpenAPIJBangTask(this.workspaceFolder, fileName, openAPIfilePath.fsPath).execute();
				await commands.executeCommand('vscode.open', Uri.file(filePath));
			}
		}
	}

	async showDialogToPickOpenAPIFile(): Promise<Uri> { 
		const openApifileNames = await window.showOpenDialog(
			{
				canSelectMany: false,
				openLabel: 'Select',
				title: 'Select an OpenAPI file',
				filters: {'OpenAPI': ['yaml', 'yml', 'json']
			}});
		if(openApifileNames !== undefined) {
			return openApifileNames[0];
		}
		return Uri.parse('');
	}
}


