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

import * as vscode from 'vscode';
import * as chai from 'chai';
import { getDocUri, activate } from './helper';
import { checkExpectedCompletion, checkNotExpectedCompletion } from './completion.util';
import waitUntil from 'async-wait-until';

const expect = chai.expect;

const RUNTIME_PROVIDER_SETTINGS_KEY = 'camel.Camel catalog runtime provider';

describe('Should do completion in Camel URI using the Camel Catalog version specified in preference', () => {
	const docUriXml = getDocUri('test-catalog-version.xml');
	const expectedCompletion = { label: 'jgroups-raft:clusterName'};

	afterEach(async () => {
		const config = vscode.workspace.getConfiguration();
		await config.update(RUNTIME_PROVIDER_SETTINGS_KEY, undefined);
		await waitUntil( async() =>  {
			return (await vscode.workspace.getConfiguration().get(RUNTIME_PROVIDER_SETTINGS_KEY)) === '';
		});
	});

	it('Updated Catalog runtime provider is reflected in completion', async () => {
		await activate(docUriXml);
		const config = vscode.workspace.getConfiguration();
		expect(config.get(RUNTIME_PROVIDER_SETTINGS_KEY)).to.not.be.equal('KARAF');
		await checkExpectedCompletion(docUriXml, new vscode.Position(0, 21), expectedCompletion);
		await config.update(RUNTIME_PROVIDER_SETTINGS_KEY, 'KARAF');

		await waitUntil( async() =>  {
			return (await vscode.workspace.getConfiguration().get(RUNTIME_PROVIDER_SETTINGS_KEY)) === 'KARAF';
		});

		await checkNotExpectedCompletion(docUriXml, new vscode.Position(0, 21), expectedCompletion);

		await config.update(RUNTIME_PROVIDER_SETTINGS_KEY, undefined);
		await checkExpectedCompletion(docUriXml, new vscode.Position(0, 21), expectedCompletion);
	});

});
