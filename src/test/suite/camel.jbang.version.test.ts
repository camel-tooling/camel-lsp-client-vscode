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

import { ShellExecution, workspace } from 'vscode';
import { CamelInitJBangTask } from '../../tasks/CamelInitJBangTask';
import { expect } from 'chai';

describe('Should run commands with Camel JBang version specified in settings', () => {

	const CAMEL_JBANG_VERSION = '3.20.2';
	const CAMEL_JBANG_VERSION_SETTINGS_ID = 'camel.languageSupport.JBangVersion';

	let defaultJBangVersion = '';

	before(function () {
		defaultJBangVersion = workspace.getConfiguration().get(CAMEL_JBANG_VERSION_SETTINGS_ID) as string;
	});

	after(async function () {
		await workspace.getConfiguration().update(CAMEL_JBANG_VERSION_SETTINGS_ID, defaultJBangVersion);
	});

	it('Default Camel JBang version is not empty', async () => {
		expect(workspace.getConfiguration().get(CAMEL_JBANG_VERSION_SETTINGS_ID)).to.not.be.undefined;
	});

	it('Updated Camel JBang version is correct in generated task execution args', async () => {
		const config = workspace.getConfiguration();
		expect(config.get(CAMEL_JBANG_VERSION_SETTINGS_ID)).to.not.be.equal(CAMEL_JBANG_VERSION);

		await config.update(CAMEL_JBANG_VERSION_SETTINGS_ID, CAMEL_JBANG_VERSION);
		if(workspace.workspaceFolders){
			const camelJBangTask = new CamelInitJBangTask(workspace.workspaceFolders[0], 'test-route.camel.yaml');
			const execution :ShellExecution = camelJBangTask.execution as ShellExecution;
			const executionArgs = execution.args;
			const executionArgsAsString = executionArgs !== undefined ? executionArgs[0].toString() : '';
			expect(executionArgsAsString).to.includes(CAMEL_JBANG_VERSION);
		}
	});

});
