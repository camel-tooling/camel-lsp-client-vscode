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

import { Uri, window } from "vscode";
import { AbstractCamelCommand } from "./AbstractCamelCommand";

export abstract class AbstractTransformCamelRouteCommand extends AbstractCamelCommand{

	protected async showDialogToPickFolder(isOutputFolder: boolean): Promise<Uri> {
		const selectedFolders = await window.showOpenDialog(
			{
				canSelectMany: false,
				canSelectFolders: true,
				canSelectFiles: false,
				openLabel: 'Select',
				title: isOutputFolder ? 'Select a folder to output the transformed routes' : 'Select a folder to run the tranform command in'
			});
		if (selectedFolders !== undefined) {
			return selectedFolders[0];
		}
		return Uri.parse('');
	}

	protected async showDialogToPickFiles(): Promise<Uri[]> {
		const selectedFiles = await window.showOpenDialog(
			{
				canSelectMany: true,
				canSelectFolders: false,
				canSelectFiles: true,
				openLabel: 'Select',
				title: 'Select files to be transformed'
			});
		if (selectedFiles !== undefined) {
			return selectedFiles;
		}
		return [Uri.parse('')];
	}
}
