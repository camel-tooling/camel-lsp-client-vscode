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

import { TextEditor, ContentAssist } from 'vscode-extension-tester';

export async function waitUntilContentAssistContains(expectedContentAssistItem: string, timeout = 10000): Promise<ContentAssist> {
	const editor = new TextEditor();
	let contentAssist: ContentAssist | undefined;
	await editor.getDriver().wait(async function () {
		contentAssist = await editor.toggleContentAssist(true) as ContentAssist;
		const hasItem = await contentAssist.hasItem(expectedContentAssistItem);
		if (!hasItem) {
			await editor.toggleContentAssist(false);
		}
		return hasItem;
	}, timeout);
	if (contentAssist === undefined) {
        throw new Error("Content assist was not initialized.");
    }
	return contentAssist;
}
