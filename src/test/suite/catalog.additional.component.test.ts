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
