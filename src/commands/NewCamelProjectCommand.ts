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

import { WorkspaceFolder, window, workspace } from "vscode";
import { CamelExportJBangTask } from "../tasks/CamelExportJBangTask";

export abstract class NewCamelProjectCommand {

	async create() {
		const input = await this.askForGAV();
		if (input) {
			let workspaceFolder: WorkspaceFolder | undefined;
			if (workspace.workspaceFolders) {
				// default to root workspace folder
				workspaceFolder = workspace.workspaceFolders[0];
			}
			await new CamelExportJBangTask(workspaceFolder, input, this.getRuntime()).execute();
		}
	}

	abstract getRuntime(): string;

	async askForGAV() {
		return await window.showInputBox({
			prompt: 'Please provide repository coordinate',
			placeHolder: 'com.acme:myproject:1.0-SNAPSHOT',
			value: 'com.acme:myproject:1.0-SNAPSHOT',
			validateInput: (gav) => {
				return this.validateGAV(gav);
			},
		});
	}

	/**
	 * Maven GAV validation
	 * 	- no empty name
	 *  - Have 2 double-dots (similar check than Camel JBang)
	 *  - following mostly recommendations from Maven Central for name rules
	 *
	 * @param name
	 * @returns string | undefined
	 */
	public validateGAV(name: string): string | undefined {
		if (!name) {
			return 'Please provide a GAV for the new project following groupId:artifactId:version pattern.';
		}
		if (name.includes(' ')) {
			return 'The GAV cannot contain a space. It must constituted from groupId, artifactId and version following groupId:artifactId:version pattern.';
		}
		const gavs = name.split(':');
		if (gavs.length !== 3) {
			return 'The GAV needs to have double-dot `:` separator and constituted from groupId, artifactId and version';
		}
		const groupIdSplit = gavs[0].split('.');
		if (groupIdSplit[0].length === 0) {
			return 'The group id cannot start with a .';
		}
		for (const groupidSubPart of groupIdSplit) {
			const regExpSearch = /^[a-z]\w*$/.exec(groupidSubPart);
			if(regExpSearch === null || regExpSearch.length === 0) {
				return `Invalid subpart of group Id: ${groupidSubPart}} . It must follow groupId:artifactId:version pattern with group Id subpart separated by dot needs to follow this specific pattern: [a-zA-Z]\\w*`;
			}
		}

		const artifactId = gavs[1];
		const regExpSearchArtifactId = /^[a-zA-Z]\w*$/.exec(artifactId);
		if(regExpSearchArtifactId === null || regExpSearchArtifactId.length === 0) {
			return `Invalid artifact Id: ${artifactId}} . It must follow groupId:artifactId:version pattern with artifactId specific pattern: [a-zA-Z]\\w*`;
		}

		const version = gavs[2];
		const regExpSearch = /^\d[\w-.]*$/.exec(version);
		if(regExpSearch === null || regExpSearch.length === 0) {
			return `Invalid version: ${version} . It must follow groupId:artifactId:version pattern with version specific pattern: \\d[\\w-.]*`;
		}
		return undefined;
	}

}
