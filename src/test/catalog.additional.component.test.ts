'use strict';

import * as vscode from 'vscode';
import { checkExpectedCompletion, checkNotExpectedCompletion } from './completion.util';
import { getDocUri } from './helper';

describe('Should do completion in Camel URI using the additional component specified in preference', () => {
	const docUriXml = getDocUri('test-additional-component.xml');

	afterEach(() => {
		let config = vscode.workspace.getConfiguration();
		config.update('camel.extra-components', undefined);
	});

	it('Updated additional component is reflected in completion', async () => {
		const positionToCallCompletion = new vscode.Position(0, 11);
		const completionItemLabel = { label: 'acomponent:withsyntax' };
		await checkNotExpectedCompletion(docUriXml, positionToCallCompletion, completionItemLabel);

		let config = vscode.workspace.getConfiguration();
		await config.update('camel.extra-components', [{
			'component' : {
				'kind': 'component',
				'scheme': 'acomponent',
				'syntax': 'acomponent:withsyntax'
			}
		}]);
		await checkExpectedCompletion(docUriXml, positionToCallCompletion, completionItemLabel);

		await config.update('camel.extra-components', undefined);
		await checkNotExpectedCompletion(docUriXml, positionToCallCompletion, completionItemLabel);
	});

});
