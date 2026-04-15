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

import * as child_process from 'node:child_process';
import path from 'path';
import { ShellExecution, workspace } from "vscode";
import { arePathsEqual, getCurrentWorkingDirectory } from "./utils";
import * as vscode from 'vscode';

const isWindows: boolean = process.platform.startsWith('win');

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

	public createProject(gav: string, runtime: string, outputPath: string): ShellExecution {

		// Workaround for an issue during camel jbang execution in windows machines.
		// Specifying the --directory option with the complete path when it is equal to the current working directory causes issues.
		// Omitting the option or in this case using '.' works as expected.
		let cwd = getCurrentWorkingDirectory();
		if (cwd && arePathsEqual(cwd, outputPath)) {
			outputPath = '.';
		} else if (!cwd) {
			// In an empty workspace VS Code rejects tasks that set a custom cwd outside the user home.
			// Keep the absolute output path so JBang exports into the selected folder directly.
		}

		if (this.camelVersion.startsWith('4.12') && isWindows) {
			vscode.window.showInformationMessage('The created project do not have the Maven wrapper because Camel JBang 4.12 is used on Windows. If you want the Maven wrapper either: call `mvn wrapper:wrapper` on the created project, recreate the project using a different Camel Version or using a non-Windows OS.');
			return new ShellExecution('jbang',
			[`'-Dcamel.jbang.version=${this.camelVersion}'`,
				'camel@apache/camel',
				'export',
				`--runtime=${runtime}`,
				`--gav=${gav}`,
				`'--directory=${outputPath}'`,
				'--maven-wrapper=false'], {cwd});
		} else {
			return new ShellExecution('jbang',
			[`'-Dcamel.jbang.version=${this.camelVersion}'`,
				'camel@apache/camel',
				'export',
				`--runtime=${runtime}`,
				`--gav=${gav}`,
				`'--directory=${outputPath}'`], {cwd});
		}
	}

	public async createProjectWithoutTask(gav: string, runtime: string, outputPath: string): Promise<void> {
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: 'Creating Camel project'
		}, async () => {
			return await new Promise<void>((resolve, reject) => {
				const childProcess = this.spawnJbang(this.computeCreateProjectArgs(gav, runtime, outputPath), getCurrentWorkingDirectory());
				let errorOutput = '';

				childProcess.stderr.on('data', data => {
					errorOutput += data.toString();
				});
				childProcess.on('error', reject);
				childProcess.on('close', code => {
					if (code === 0) {
						resolve();
					} else {
						reject(new Error(errorOutput || `Camel project creation failed with exit code ${code}.`));
					}
				});
			});
		});
	}

	public generateRest(routefile: string, openApiFile: string): ShellExecution {
		return new ShellExecution('jbang',
			[`'-Dcamel.jbang.version=${this.camelVersion}'`,
				'camel@apache/camel',
				'generate',
				'rest',
				`'--input=${openApiFile}'`,
				`'--output=${routefile}'`,
				'--routes']);
	}

	public transformSingleRoute(sourcePath: string, format: string, outputPath: string) {
		return new ShellExecution('jbang',
			[`'-Dcamel.jbang.version=${this.camelVersion}'`,
				'camel@apache/camel',
				'transform',
				'route',
				`'${sourcePath}'`,
				`'--format=${format}'`,
				`'--output=${outputPath}'`,]);
	}

	public transformRoutesInFolder(sourcePath: string, format: string, outputPath: string,) {
		const pathSeparatorAndWildcard = process.platform === 'win32' ? `${path.sep}*'` : `'${path.sep}*`;
		return new ShellExecution('jbang',
			[`'-Dcamel.jbang.version=${this.camelVersion}'`,
				'camel@apache/camel',
				'transform',
				'route',
				`'${sourcePath}${pathSeparatorAndWildcard}`,
				`'--format=${format}'`,
				`'--output=${outputPath}'`,]);
	}

	public transformRoutesInMultipleFiles(sourcePaths: string[], format: string, outputPath: string) {
		const joinedSourcePaths = sourcePaths.map(
			sourcePath => `'${sourcePath}'`
		).join(' ');
		return new ShellExecution('jbang',
			[`'-Dcamel.jbang.version=${this.camelVersion}'`,
				'camel@apache/camel',
				'transform',
				'route',
				joinedSourcePaths,
			`'--format=${format}'`,
			`'--output=${outputPath}'`,]);
	}

	public add(plugin: string): ShellExecution {
		return new ShellExecution('jbang',
			[`'-Dcamel.jbang.version=${this.camelVersion}'`,
				'camel@apache/camel',
				'plugin',
				'add',
				plugin]);
	}

	private computeCreateProjectArgs(gav: string, runtime: string, outputPath: string): string[] {
		const args = [
			`-Dcamel.jbang.version=${this.camelVersion}`,
			'camel@apache/camel',
			'export',
			`--runtime=${runtime}`,
			`--gav=${gav}`,
			`--directory=${outputPath}`
		];

		if (this.camelVersion.startsWith('4.12') && isWindows) {
			vscode.window.showInformationMessage('The created project do not have the Maven wrapper because Camel JBang 4.12 is used on Windows. If you want the Maven wrapper either: call `mvn wrapper:wrapper` on the created project, recreate the project using a different Camel Version or using a non-Windows OS.');
			args.push('--maven-wrapper=false');
		}

		return args;
	}

	protected spawnJbang(args: string[], cwd: string | undefined): child_process.ChildProcessWithoutNullStreams {
		return child_process.spawn('jbang', args, { cwd });
	}

}
