/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import * as path from 'path';
import * as fs from 'fs';
import { ExTester, ReleaseQuality } from 'vscode-uitests-tooling';

export const storageFolder = 'test-resources';
const releaseType: ReleaseQuality = process.env.CODE_TYPE === 'insider' ? ReleaseQuality.Insider : ReleaseQuality.Stable;
export const projectPath = path.resolve(__dirname, '..', '..', '..');
const extensionFolder = path.join(projectPath, '.test-extensions');

async function main(): Promise<void> {
    const tester = new ExTester(storageFolder, releaseType, extensionFolder);
    await tester.setupAndRunTests('out/src/ui-test/tests/*.test.js',
        process.env.CODE_VERSION,
        {
            'installDependencies': true
        },
        {
            'cleanup': true,
            'settings': './src/ui-test/resources/vscode-settings.json',
            resources: []
        });
    fs.rmSync(extensionFolder, { recursive: true });
}

main();
