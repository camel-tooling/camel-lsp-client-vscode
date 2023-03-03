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
'use strict'

import { ShellExecution } from "vscode";

/**
 * Camel JBang class which allows shell execution of jbang cli init command
 */
export class CamelJBang {

	public static DEFAULT_CAMEL_VERSION = '3.20.3';

	private camelVersion: string;

	constructor(version?: string) {
		this.camelVersion = version ? version : CamelJBang.DEFAULT_CAMEL_VERSION;
	}

	public init(file: string): ShellExecution {
		return new ShellExecution('jbang', ['run', `'-Dcamel.jbang.version=${this.camelVersion}'`, 'camel@apache/camel', 'init', `'${file}'`]);
	}
}
