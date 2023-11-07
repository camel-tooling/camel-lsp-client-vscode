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
import { checkExpectedCompletion, checkNotExpectedCompletion } from './completion.util';
import { getDocUri } from './helper';
import waitUntil from 'async-wait-until';

describe('Should do completion in Camel URI using the additional component specified in preference', () => {
	const docUriXml = getDocUri('test-additional-component.xml');

	afterEach(async () => {
		const config = vscode.workspace.getConfiguration();
		await config.update('camel.extra-components', undefined);
		await waitUntil( async() =>  {
			return ((await vscode.workspace.getConfiguration().get('camel.extra-components')) as []).length === 0;
		});
	});

	it('Updated additional component is reflected in completion', async () => {
		const positionToCallCompletion = new vscode.Position(0, 11);
		const completionItemLabel = { label: 'acomponent:withsyntax' };
		await checkNotExpectedCompletion(docUriXml, positionToCallCompletion, completionItemLabel);

		const config = vscode.workspace.getConfiguration();
		await config.update('camel.extra-components', [{
			'component' : {
				'kind': 'component',
				'scheme': 'acomponent',
				'syntax': 'acomponent:withsyntax'
			}
		}]);

		await waitUntil( async() =>  {
			return (await vscode.workspace.getConfiguration().get('camel.extra-components')) !== undefined;
		});
		await checkExpectedCompletion(docUriXml, positionToCallCompletion, completionItemLabel);

		await config.update('camel.extra-components', undefined);
		await checkNotExpectedCompletion(docUriXml, positionToCallCompletion, completionItemLabel);
	});

});
