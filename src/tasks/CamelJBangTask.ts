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

import { Task, TaskDefinition, tasks, TaskScope, WorkspaceFolder } from 'vscode';
import { CamelJBang } from '../requirements/CamelJBang';

/**
 * This class represents implementation of vscode.task for Camel JBang.
 */
export class CamelJBangTask extends Task {

	public static LABEL_PROVIDED_TASK  = 'Init Camel Route file with JBang';

	constructor(scope: WorkspaceFolder | TaskScope.Workspace, file: string, problemMatchers?: string | string[]) {

		const taskDefinition: TaskDefinition = {
			'label': CamelJBangTask.LABEL_PROVIDED_TASK,
			'type': 'shell'
		};

		super(
			taskDefinition,
			scope,
			CamelJBangTask.LABEL_PROVIDED_TASK,
			'camel',
			new CamelJBang().init(file),
			problemMatchers
		);
	}

	public async execute(): Promise<void> {
		await tasks.executeTask(this);
		return await this.waitForEnd();
	}

	private async waitForEnd(): Promise<void> {
		await new Promise<void>(resolve => {
			const disposable = tasks.onDidEndTask(e => {
				if (e.execution.task.name === CamelJBangTask.LABEL_PROVIDED_TASK) {
					disposable.dispose();
					resolve();
				}
			});
		});
	}

}
