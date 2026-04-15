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

import { expect } from 'chai';
import * as path from 'path';
import { ShellExecution } from 'vscode';
import * as sinon from 'sinon';
import * as utils from '../../requirements/utils';
import { CamelJBang } from '../../requirements/CamelJBang';

describe('Should create Camel projects with a stable output directory in empty workspaces', () => {
	let getCurrentWorkingDirectoryStub: sinon.SinonStub;

	beforeEach(function () {
		getCurrentWorkingDirectoryStub = sinon.stub(utils, 'getCurrentWorkingDirectory').returns(undefined);
	});

	afterEach(function () {
		getCurrentWorkingDirectoryStub.restore();
	});

	it('Keeps the selected output path when no workspace folder is opened', function () {
		const outputPath = path.join(process.cwd(), 'camel-project-output');
		const shellExecution = new CamelJBang().createProject('com.demo:test:1.0-SNAPSHOT', 'quarkus', outputPath);

		expect(shellExecution).to.be.instanceOf(ShellExecution);
		expect(shellExecution.args.some(arg => arg.toString().includes(`--directory=${outputPath}`))).to.be.true;
		expect(shellExecution.options?.cwd).to.be.undefined;
	});
});
