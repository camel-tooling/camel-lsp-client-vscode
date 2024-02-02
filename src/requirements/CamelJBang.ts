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

import { ShellExecution, workspace } from "vscode";

/**
 * Camel JBang class which allows shell execution of different jbang cli commands
 */
export class CamelJBang {

	private camelVersion: string;

	constructor() {
		this.camelVersion = workspace.getConfiguration().get('camel.languageSupport.JBangVersion') as string;
	}

	public init(file: string): ShellExecution {
		return new ShellExecution('jbang', [`'-Dcamel.jbang.version=${this.camelVersion}'`, 'camel@apache/camel', 'init', `'${file}'`]);
	}

	public bind(file: string, source: string, sink: string): ShellExecution {
		return new ShellExecution('jbang', [`'-Dcamel.jbang.version=${this.camelVersion}'`, 'camel@apache/camel', 'bind', '--source', source, '--sink', sink, `'${file}'`]);
	}

	public createProject(gav: string, runtime: string): ShellExecution {
		return new ShellExecution('jbang', [`'-Dcamel.jbang.version=${this.camelVersion}'`, 'camel@apache/camel', 'export', `--runtime=${runtime}`, `--gav=${gav}`]);
	}

	public generateRest(routefile: string, openApiFile: string) {
		return new ShellExecution('jbang',
			[`'-Dcamel.jbang.version=${this.camelVersion}'`,
			'camel@apache/camel',
			'generate',
			'rest',
			`'--input=${openApiFile}'`,
			`'--output=${routefile}'`,
			'--routes']);
	}
}
