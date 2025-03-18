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

interface TreeGenerationOptions {
    maxDepth: number;
    includeFiles: boolean;
    action: 'Copy to clipboard' | 'Insert at cursor position' | 'Create new file';
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

        // Get all user inputs in one go
        const options = await collectInputs(defaultMaxDepth);
        if (!options) {
            return; // User canceled
        }
        
        const { maxDepth, includeFiles, action } = options;

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

        // Handle the selected action
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

async function collectInputs(defaultMaxDepth: number): Promise<TreeGenerationOptions | undefined> {
    interface InputBoxParameters {
        title: string;
        step: number;
        totalSteps: number;
        value: string;
        prompt: string;
        validate: (value: string) => string | undefined;
        buttons?: vscode.QuickInputButton[];
        shouldResume?: () => Promise<boolean>;
    }
    
    const title = 'Tree Generation Options';
    
    async function showInputBox({ title, step, totalSteps, value, prompt, validate }: InputBoxParameters) {
        const disposables: vscode.Disposable[] = [];
        try {
            return await new Promise<string | undefined>((resolve, reject) => {
                const input = vscode.window.createInputBox();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.value = value || '';
                input.prompt = prompt;
                input.buttons = [];
                
                let validating = validate('');
                disposables.push(
                    input.onDidAccept(async () => {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        if (validating) {
                            input.validationMessage = validating;
                        } else {
                            resolve(value);
                            input.hide();
                        }
                        input.enabled = true;
                        input.busy = false;
                    }),
                    input.onDidChangeValue(async text => {
                        validating = validate(text);
                        input.validationMessage = validating;
                    }),
                    input.onDidHide(() => {
                        resolve(undefined);
                        input.dispose();
                    })
                );
                
                input.show();
            });
        } finally {
            disposables.forEach(d => d.dispose());
        }
    }
    
    // Max depth input
    const maxDepthStr = await showInputBox({
        title,
        step: 1,
        totalSteps: 3,
        value: defaultMaxDepth.toString(),
        prompt: 'Maximum folder depth to display (enter -1 for unlimited)',
        validate: (value: string) => {
            const num = parseInt(value);
            return isNaN(num) ? 'Please enter a valid number' : undefined;
        }
    });
    
    if (maxDepthStr === undefined) {
        return undefined;
    }
    
    // Include files selection
    const includeFilesOptions = ['Yes', 'No'].map(label => ({ label }));
    const includeFilesSelected = await vscode.window.showQuickPick(
        includeFilesOptions,
        {
            title,
            placeHolder: 'Include files in tree?'
        }
    );
    
    if (!includeFilesSelected) {
        return undefined;
    }
    
    const includeFiles = includeFilesSelected.label === 'Yes';
    
    // Action selection
    const actionOptions = ['Copy to clipboard', 'Insert at cursor position', 'Create new file'].map(label => ({ label }));
    const selectedAction = await vscode.window.showQuickPick(
        actionOptions,
        {
            title,
            placeHolder: 'What would you like to do with the generated tree?'
        }
    );
    
    if (!selectedAction) {
        return undefined;
    }
    
        return {
            maxDepth: parseInt(maxDepthStr),
            includeFiles,
            action: selectedAction.label as 'Copy to clipboard' | 'Insert at cursor position' | 'Create new file'
        };
    }
