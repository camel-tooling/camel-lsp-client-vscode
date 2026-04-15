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

import * as child_process from 'node:child_process';
import { EventEmitter } from 'node:events';
import * as path from 'node:path';
import { expect } from 'chai';
import { ShellExecution, workspace, window } from 'vscode';
import * as sinon from 'sinon';
import * as utils from '../../requirements/utils';
import { CamelJBang } from '../../requirements/CamelJBang';

describe('Should create Camel projects with a stable output directory in empty workspaces', () => {
	beforeEach(function () {
		sinon.stub(utils, 'getCurrentWorkingDirectory').returns(undefined);
	});

	afterEach(function () {
		sinon.restore();
	});

	it('Keeps the selected output path when no workspace folder is opened', function () {
		const outputPath = path.join(process.cwd(), 'camel-project-output');
		const shellExecution = new CamelJBang().createProject('com.demo:test:1.0-SNAPSHOT', 'quarkus', outputPath);

		expect(shellExecution).to.be.instanceOf(ShellExecution);
		expect(shellExecution.args.some(arg => arg.toString().includes(`--directory=${outputPath}`))).to.be.true;
		expect(shellExecution.options?.cwd).to.be.undefined;
	});

	it('Executes the project creation directly when no workspace folder is opened', async function () {
		const outputPath = path.join(process.cwd(), 'camel-project-output');
		const camelVersion = workspace.getConfiguration().get('camel.languageSupport.JBangVersion') as string;
		const stderr = new EventEmitter();
		const childProcess = Object.assign(new EventEmitter(), { stderr }) as unknown as child_process.ChildProcessWithoutNullStreams;
		const camelJBang = new CamelJBang();
		const spawnStub = sinon.stub(camelJBang as CamelJBang & { spawnJbang: (args: string[], cwd: string | undefined) => child_process.ChildProcessWithoutNullStreams; }, 'spawnJbang').returns(childProcess);
		const withProgressStub = sinon.stub(window, 'withProgress').callsFake(async (_options, task) => {
			return await task({ report() { /* no-op */ } }, {} as never);
		});

		const createProjectPromise = camelJBang.createProjectWithoutTask('com.demo:test:1.0-SNAPSHOT', 'quarkus', outputPath);
		childProcess.emit('close', 0);
		await createProjectPromise;

		expect(withProgressStub.calledOnce).to.be.true;
		expect(spawnStub.calledOnce).to.be.true;
		expect(spawnStub.firstCall.args[0]).to.deep.equal([
			`-Dcamel.jbang.version=${camelVersion}`,
			'camel@apache/camel',
			'export',
			'--runtime=quarkus',
			'--gav=com.demo:test:1.0-SNAPSHOT',
			`--directory=${outputPath}`
		]);
		expect(spawnStub.firstCall.args[1]).to.be.undefined;
	});
	});
