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

import { WorkspaceFolder, workspace } from "vscode";

export interface CamelRouteDSL {
	language: string;
	extension: string;
	placeHolder: string;
}

export abstract class AbstractCamelCommand {

	protected workspaceFolder: WorkspaceFolder | undefined;
	protected camelDSL: CamelRouteDSL | undefined;

	constructor(dsl: string) {
		this.camelDSL = this.getDSL(dsl);
		this.workspaceFolder = this.getWorkspaceFolder();
	}

	protected getDSL(dsl: string): CamelRouteDSL | undefined {
		switch (dsl) {
			case 'YAML':
				return { language: 'Yaml', extension: 'camel.yaml', placeHolder: 'sample-route' };
			case 'JAVA':
				return { language: 'Java', extension: 'java', placeHolder: 'SampleRoute' };
			case 'XML':
				return { language: 'Xml', extension: 'camel.xml', placeHolder: 'sample-route' };
			default:
				return undefined;
		}
	}

	/**
	 * Resolves first opened folder in vscode existing workspace
	 *
	 * @returns WorkspaceFolder object
	 */
	private getWorkspaceFolder(): WorkspaceFolder | undefined {
		let workspaceFolder: WorkspaceFolder | undefined;
		if (workspace.workspaceFolders) {
			// default to root workspace folder
			workspaceFolder = workspace.workspaceFolders[0];
		}
		return workspaceFolder;
	}

}
