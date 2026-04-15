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
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { computeLaunchArgs } from '../TestRunUtils';

describe('Should compute VS Code test launch args', () => {

	it('Uses a folder URI for the workspace path on Windows', function () {
		const extensionDevelopmentPath = path.join(process.cwd(), 'camel-extension');
		const testWorkspace = path.join(extensionDevelopmentPath, 'test Fixture with speci@l chars');

		expect(computeLaunchArgs(testWorkspace, extensionDevelopmentPath, 'win32')).to.deep.equal([
			`--folder-uri=${pathToFileURL(testWorkspace).toString()}`,
			'--disable-workspace-trust',
			`--user-data-dir=${path.join(extensionDevelopmentPath, '.vscode-test')}`
		]);
	});

	it('Keeps the raw workspace path on non-Windows platforms', function () {
		const extensionDevelopmentPath = path.join(process.cwd(), 'camel-extension');
		const testWorkspace = path.join(extensionDevelopmentPath, 'test Fixture with speci@l chars');

		expect(computeLaunchArgs(testWorkspace, extensionDevelopmentPath, 'linux')).to.deep.equal([
			testWorkspace,
			'--disable-workspace-trust',
			`--user-data-dir=${path.join(extensionDevelopmentPath, '.vscode-test')}`
		]);
	});
});
