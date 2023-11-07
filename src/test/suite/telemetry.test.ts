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

import * as telemetry from '../../Telemetry';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { expect } from 'chai';
import { TelemetryEvent } from '@redhat-developer/vscode-redhat-telemetry/lib';
import { getDocUri } from './helper';
import { waitUntil } from 'async-wait-until';
import { fail } from 'assert';

describe('Check Telemetry', () => {

	let telemetrySpy: sinon.SinonSpy;

	const docUriXml = getDocUri('apacheCamel-telemetry.xml');

	beforeEach(async() => {
		telemetrySpy = sinon.spy(await telemetry.getTelemetryServiceInstance(), 'send');
	});

	afterEach(async () => {
		telemetrySpy.restore();
	});

	it('Check Telemetry event when opened document sent with language xml', async () => {
		await vscode.workspace.openTextDocument(docUriXml);
		await checkTelemetry(telemetrySpy, 'xml');
	});

});

export async function checkTelemetry(telemetrySpy: sinon.SinonSpy<any[], any>, languageExtension: string) {
	try {
		await waitUntil(() => {
			return telemetrySpy.calledOnce;
		}, 10000, 1000);
	} catch(e) {
		fail(`telemetry expected to be called once but was called ${telemetrySpy.callCount} time(s).`);
	}
	const actualEvent: TelemetryEvent = telemetrySpy.getCall(0).args[0];
	expect(actualEvent.name).to.be.equal('camel.lsp.open.document');
	expect(actualEvent.properties.language).to.be.equal(languageExtension);
}
