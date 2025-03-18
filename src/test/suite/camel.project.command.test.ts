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
import { NewCamelQuarkusProjectCommand } from '../../commands/NewCamelQuarkusProjectCommand';
import { NewCamelSpringBootProjectCommand } from '../../commands/NewCamelSpringBootProjectCommand';

describe('Should validate Create a Camel Project command', function () {

	const COMMANDS = [new NewCamelQuarkusProjectCommand(), new NewCamelSpringBootProjectCommand()];

	COMMANDS.forEach(async command => {
		const runtime = await command.getRuntime();
		context(`GAV validation of ${runtime}`, function () {

			it('Validate ok', function () {
				expect(command.validateGAV('com.test:demo:1.0-SNAPSHOT')).to.be.undefined;
				expect(command.validateGAV('com:demo:1.0-SNAPSHOT')).to.be.undefined;
				expect(command.validateGAV('com.test:demo:1.0')).to.be.undefined;
				expect(command.validateGAV('com.test:demo-with-hyphen:1.0')).to.be.undefined;
				expect(command.validateGAV('com.test:demo:1.0+df0')).to.be.undefined;
			});

			it('Validate not empty', function () {
				expect(command.validateGAV('')).to.not.be.undefined;
			});

			it('Validate contains 2 double-dots (basic check done by Camel JBang)', function () {
				expect(command.validateGAV('invalid')).to.not.be.undefined;
				expect(command.validateGAV('invalid:invalid')).to.not.be.undefined;
				expect(command.validateGAV('valid:valid:1.0-SNAPSHOT')).to.be.undefined;
			});

			it('Validate does not contain space', function () {
				expect(command.validateGAV('invalid:with space:1.0-SNAPSHOT')).to.not.be.undefined;
				expect(command.validateGAV('with space:invalid:1.0-SNAPSHOT')).to.not.be.undefined;
				expect(command.validateGAV('invalid:invalid:1.0- with space')).to.not.be.undefined;
			});

			it('Validate contains invalid characters', function () {
				expect(command.validateGAV('.invalid:valid:1.0-SNAPSHOT')).to.not.be.undefined;
				expect(command.validateGAV('%invalid:valid:1.0-SNAPSHOT')).to.not.be.undefined;
				expect(command.validateGAV('va.lid:%invalid:1.0-SNAPSHOT')).to.not.be.undefined;
				expect(command.validateGAV('va.lid:valid:1.0-%invalid')).to.not.be.undefined;
				expect(command.validateGAV('valid:Invalid:1.0-%invalid')).to.not.be.undefined;
				expect(command.validateGAV('valid:Invalid:1.0')).to.not.be.undefined;
				expect(command.validateGAV('valid:in_valid:1.0')).to.not.be.undefined;
			});
		});
	});
});
