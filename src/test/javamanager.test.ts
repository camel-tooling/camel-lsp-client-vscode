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

const fs = require('fs');
const tmp = require('tmp');
import * as vscode from 'vscode';
import * as chai from 'chai';
import { retrieveJavaExecutable } from '../JavaManager';
import { computeRequirementsData, extensionContext } from '../extension';

const expect = chai.expect;

describe('Should use correct java executable', () => {

	let previousWorkspaceConfig: string | undefined;
	let previousGlobalConfig: string | undefined

	beforeEach(async () => {
		const config = vscode.workspace.getConfiguration();
		const javaHomeSetting = config.inspect<string>('java.home');
		previousWorkspaceConfig = javaHomeSetting.workspaceValue;
		previousGlobalConfig = javaHomeSetting.globalValue;
		await config.update('java.home', undefined, vscode.ConfigurationTarget.Workspace);
		await config.update('java.home', undefined, vscode.ConfigurationTarget.Global);
		await config.update('java.home', undefined);
	});

	afterEach(async () => {
		let config = vscode.workspace.getConfiguration();
		await config.update('java.home', previousWorkspaceConfig, vscode.ConfigurationTarget.Workspace);
		await config.update('java.home', previousGlobalConfig, vscode.ConfigurationTarget.Global);
	});

	it('With Workspace settings', async () => {
		let config = vscode.workspace.getConfiguration();
		const dir = createFakeJDKFolder();
		await config.update('java.home', dir.name, vscode.ConfigurationTarget.Workspace);
		expect(retrieveJavaExecutable(await computeRequirementsData(extensionContext))).to.equal(dir.name + '/bin/java');
	});

	it('With Global settings', async () => {
		let config = vscode.workspace.getConfiguration();
		const dir = createFakeJDKFolder();
		await config.update('java.home', dir.name, vscode.ConfigurationTarget.Global);
		expect(retrieveJavaExecutable(await computeRequirementsData(extensionContext))).to.equal(dir.name + '/bin/java');
	});

	it('With Workspace and Global settings', async () => {
		let config = vscode.workspace.getConfiguration();
		const dirForWorkspace = createFakeJDKFolder();
		await config.update('java.home', dirForWorkspace.name, vscode.ConfigurationTarget.Workspace);
		const dirForGlobal = createFakeJDKFolder();
		await config.update('java.home', dirForGlobal.name, vscode.ConfigurationTarget.Global);
		expect(retrieveJavaExecutable(await computeRequirementsData(extensionContext))).to.equal(dirForWorkspace.name + '/bin/java');
	});

	it('With Global settings', async () => {
		let config = vscode.workspace.getConfiguration();
		const dirForGlobal = createFakeJDKFolder();
		await config.update('java.home', dirForGlobal.name);
		expect(retrieveJavaExecutable(await computeRequirementsData(extensionContext))).to.equal(dirForGlobal.name + '/bin/java');
	});

	it('Without settings at VS Code level', async () => {
		expect(retrieveJavaExecutable(await computeRequirementsData(extensionContext))).to.equal('java');
	});

});

function createFakeJDKFolder() {
	const dir = tmp.dirSync();
	console.log('temp folder: '+dir.name);
	console.log(fs.mkdirSync(dir.name + '/bin'));
	fs.writeFileSync(dir.name + '/bin/java', '');
	fs.writeFileSync(dir.name + '/bin/javac', '');
	fs.writeFileSync(dir.name + '/bin/java.exe', '');
	fs.writeFileSync(dir.name + '/bin/javac.exe', '');
	return dir;
}

