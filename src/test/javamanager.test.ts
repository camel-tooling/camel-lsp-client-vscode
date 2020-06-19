/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import * as vscode from 'vscode';
import * as chai from 'chai';
import { retrieveJavaExecutable } from '../JavaManager';

const expect = chai.expect;

describe('Should use correct java executable', () => {

	let previousWorkspaceConfig: string | undefined;
	let previousGlobalConfig: string | undefined

	beforeEach(() => {
		let config = vscode.workspace.getConfiguration();
		const javaHomeSetting = config.inspect<string>('java.home');
		previousWorkspaceConfig = javaHomeSetting.workspaceValue;
		previousGlobalConfig = javaHomeSetting.globalValue;
		config.update('java.home', undefined, vscode.ConfigurationTarget.Workspace);
		config.update('java.home', undefined, vscode.ConfigurationTarget.Global);
	});

	afterEach(() => {
		let config = vscode.workspace.getConfiguration();
		config.update('java.home', previousWorkspaceConfig, vscode.ConfigurationTarget.Workspace);
		config.update('java.home', previousGlobalConfig, vscode.ConfigurationTarget.Global);
	});

	it('With Workspace settings', async () => {
		let config = vscode.workspace.getConfiguration();
		await config.update('java.home', '/a/dummy/workspace/path', vscode.ConfigurationTarget.Workspace);
		expect(retrieveJavaExecutable()).to.equal('/a/dummy/workspace/path/bin/java');
	});

	it('With Global settings', async () => {
		let config = vscode.workspace.getConfiguration();
		await config.update('java.home', '/a/dummy/global/path', vscode.ConfigurationTarget.Global);
		expect(retrieveJavaExecutable()).to.equal('/a/dummy/global/path/bin/java');
	});

	it('With Workspace and Global settings', async () => {
		let config = vscode.workspace.getConfiguration();
		await config.update('java.home', '/a/dummy/workspace/path', vscode.ConfigurationTarget.Workspace);
		await config.update('java.home', '/a/dummy/global/path', vscode.ConfigurationTarget.Global);
		expect(retrieveJavaExecutable()).to.equal('/a/dummy/workspace/path/bin/java');
	});

	it('With Global settings', async () => {
		let config = vscode.workspace.getConfiguration();
		await config.update('java.home', '/a/dummy/global/path');
		expect(retrieveJavaExecutable()).to.equal('/a/dummy/global/path/bin/java');
	});

	it('Without settings at VS Code level', async () => {
		expect(retrieveJavaExecutable()).to.equal('java');
	});

});
