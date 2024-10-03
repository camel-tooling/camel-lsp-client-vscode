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

import { FileType, Uri, workspace } from 'vscode';
import { CamelTransformRoutesInFolderJBangTask } from '../tasks/CamelTransformRoutesInFolderJBangTask';
import { AbstractTransformCamelRouteCommand } from './AbstractTransformCamelRouteCommand';
import { isEqual } from 'lodash';

export class TransformCamelRoutesInFolderCommand extends AbstractTransformCamelRouteCommand{

	public static readonly ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTES_IN_FOLDER_TO_YAML = 'camel.jbang.transform.routes.in.folder.yaml';
	public static readonly ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTES_IN_FOLDER_TO_XML = 'camel.jbang.transform.routes.in.folder.xml';

	public async create(uri?: Uri): Promise<void> {

		// If an Uri was passed and it is a folder use it otherwise defaults to opening a dialog to select a soucer folder
		let sourceFolder = uri;
		if (!sourceFolder || !(await workspace.fs.stat(sourceFolder).then(stat => isEqual(stat.type,FileType.Directory)))) {
			sourceFolder = await this.showDialogToPickFolder(false);
		}

		const destinationFolder = await this.showDialogToPickFolder(true);

		if (sourceFolder && destinationFolder && this.workspaceFolder) {
			const format = this.camelDSL?.language ?? 'Yaml'; //Defaults to Yaml
			await new CamelTransformRoutesInFolderJBangTask(this.workspaceFolder, sourceFolder.fsPath, format, destinationFolder.fsPath).execute();
		}

	}

}
