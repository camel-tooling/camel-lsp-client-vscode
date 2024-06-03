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

import { CamelTransformRoutesInMultipleFilesToYAMLJBangTask } from '../tasks/CamelTransformRoutesInMultipleFilesToYAMLJBangTask';
import { AbstractTransformCamelRouteCommand } from './AbstractTransformCamelRouteCommand';

export class TransformCamelRoutesInMultipleFilesToYAMLCommand extends AbstractTransformCamelRouteCommand {

	public static readonly ID_COMMAND_CAMEL_JBANG_TRANSFORM_ROUTES_IN_MULTIPLES_FILES_TO_YAML = 'camel.jbang.transform.routes.in.files.yaml';

	public async create(): Promise<void> {

		const sourceFiles = await this.showDialogToPickFiles();
		const destinationFolder = await this.showDialogToPickFolder(true);

		if (sourceFiles && destinationFolder && this.workspaceFolder) {
			await new CamelTransformRoutesInMultipleFilesToYAMLJBangTask(
				this.workspaceFolder,
				sourceFiles.map(file => file.fsPath),
				destinationFolder.fsPath).execute();
		}

	}

}
