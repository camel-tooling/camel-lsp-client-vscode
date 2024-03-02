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

import { commands, Uri } from 'vscode';
import { CamelInitJBangTask } from '../tasks/CamelInitJBangTask';
import { AbstractNewCamelRouteCommand } from './AbstractNewCamelRouteCommand';

export class NewCamelRouteCommand extends AbstractNewCamelRouteCommand {

	public static ID_COMMAND_CAMEL_ROUTE_JBANG_YAML = 'camel.jbang.routes.yaml';
	public static ID_COMMAND_CAMEL_ROUTE_JBANG_JAVA = 'camel.jbang.routes.java';
	public static ID_COMMAND_CAMEL_ROUTE_JBANG_XML = 'camel.jbang.routes.xml';

	public async create(): Promise<void> {
		const input = await this.showInputBoxForFileName();
		if(input && this.camelDSL && this.workspaceFolder) {
			const fileName = this.getFullName(input, this.camelDSL.extension);
			const filePath = this.computeFullPath(this.workspaceFolder, fileName);

			await new CamelInitJBangTask(this.workspaceFolder, fileName).execute();
			await commands.executeCommand('vscode.open', Uri.file(filePath));
		}
	}
}
