import { ContentAssistItem, InputBox, Workbench } from "vscode-extension-tester";

export async function openFile(fileToOpenAbsolutePath?: string): Promise<void> {
	const workbench = new Workbench();
	await workbench.executeCommand('File: Open...');
	await workbench.openCommandPrompt();
	const input = await InputBox.create();
	await input.setText(fileToOpenAbsolutePath);
	await input.confirm();
}

/**
 * Workaround for issue with ContentAssistItem getText() method
 * For more details please see https://github.com/djelinek/vscode-uitests-tooling/issues/17
 *
 * @param item ContenAssistItem
 */
export async function getTextExt(item: ContentAssistItem): Promise<string> {
	const name: string = await item.getText();
	return name.split('\n')[0];
}
