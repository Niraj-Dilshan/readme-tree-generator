import * as vscode from 'vscode';
import { generateAsciiTree, generateMarkdownTree } from './utils/treeGenerator';
import * as path from 'path';
import * as fs from 'fs';

/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context: vscode.ExtensionContext): void {
    let generateTreeCommand = vscode.commands.registerCommand('readme-tree-generator.generateTree', async () => {
        await generateTree('ascii');
    });

    let generateMarkdownTreeCommand = vscode.commands.registerCommand('readme-tree-generator.generateMarkdownTree', async () => {
        await generateTree('markdown');
    });

    context.subscriptions.push(generateTreeCommand, generateMarkdownTreeCommand);
}

async function generateTree(format: 'ascii' | 'markdown'): Promise<void> {
    try {
        // Get workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        
        const rootPath = workspaceFolders[0].uri.fsPath;
        const rootFolderName = path.basename(rootPath);
        
        // Get settings
        const config = vscode.workspace.getConfiguration('readmeTreeGenerator');
        const excludePatterns: string[] = config.get('excludePatterns', ['node_modules', '.git', '.vscode']);
        const defaultMaxDepth: number = config.get('maxDepth', -1);
        const useMarkdownFormat: boolean = config.get('useMarkdownFormat', false);

		// Ask user for max depth
		const maxDepthInput = await vscode.window.showInputBox({
			placeHolder: 'Maximum folder depth to display (enter -1 for unlimited)',
			prompt: 'Controls how many levels deep the tree will go. 0 = root only, 1 = root and children, etc.',
			value: defaultMaxDepth.toString(),
			validateInput: (value) => {
			const num = parseInt(value);
			return isNaN(num) ? 'Please enter a valid number' : null;
			}
		});
        
        const maxDepth = maxDepthInput ? parseInt(maxDepthInput) : defaultMaxDepth;
        
        // Ask user whether to include files
        const includeFiles = await vscode.window.showQuickPick(
            ['Yes', 'No'],
            { placeHolder: 'Include files in tree? (Default: Yes)' }
        ) !== 'No';

        // Generate the tree
        let treeOutput: string;
        if (format === 'markdown') {
            // Generate ASCII tree by default
            const asciiTree = generateAsciiTree(rootPath, rootFolderName, excludePatterns, maxDepth, includeFiles);
            
            if (useMarkdownFormat) {
                // Use explicit Markdown formatting (links, bullets, etc.) only if specified
                treeOutput = generateMarkdownTree(rootPath, rootFolderName, excludePatterns, maxDepth, includeFiles);
            } else {
                // Default: Use ASCII tree wrapped in markdown code block
                treeOutput = '```\n' + asciiTree + '\n```';
            }
        } else {
            treeOutput = generateAsciiTree(rootPath, rootFolderName, excludePatterns, maxDepth, includeFiles);
        }

        // Ask user what to do with the tree
        const action = await vscode.window.showQuickPick([
            'Copy to clipboard', 
            'Insert at cursor position', 
            'Create new file'
        ], { placeHolder: 'What would you like to do with the generated tree?' });

        if (action === 'Copy to clipboard') {
            await vscode.env.clipboard.writeText(treeOutput);
            vscode.window.showInformationMessage('Tree structure copied to clipboard');
        } 
        else if (action === 'Insert at cursor position') {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.edit(editBuilder => {
                    editBuilder.insert(editor.selection.active, treeOutput);
                });
            } else {
                vscode.window.showErrorMessage('No active editor');
            }
        }
        else if (action === 'Create new file') {
            const fileName = await vscode.window.showInputBox({
                placeHolder: 'Enter file name',
                value: 'folder-structure.' + (format === 'markdown' ? 'md' : 'txt')
            });
            
            if (fileName) {
                const filePath = path.join(rootPath, fileName);
                fs.writeFileSync(filePath, treeOutput);
                
                // Open the file
                const document = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(document);
                
                vscode.window.showInformationMessage(`File '${fileName}' created`);
            }
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`Error generating tree: ${error.message}`);
    }
}

export function deactivate(): void {}
