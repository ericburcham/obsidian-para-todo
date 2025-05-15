import { App, TFile, normalizePath } from 'obsidian';
import { ParaTodoSettings } from './settings';

/**
 * Handles finding and collecting TODO files in the vault
 */
export class TodoCollector {
    constructor(
        private app: App,
        private settings: ParaTodoSettings
    ) {}

    /**
     * Find all TODO files in the vault that match our pattern
     */
    async findAllTodoFiles(): Promise<TFile[]> {
        const todoFiles: TFile[] = [];

        for (const folder of this.settings.paraFolders) {
            // Get all files in this PARA folder recursively
            const files = this.app.vault.getFiles().filter(file =>
                file.path.startsWith(folder + '/') && file.path.endsWith('.md')
            );

            // Filter for TODO files that match our pattern
            for (const file of files) {
                const pathParts = file.path.split('/');
                const fileName = pathParts[pathParts.length - 1];
                const folderName = pathParts[pathParts.length - 2];

                if (fileName === `${this.settings.todoNotePrefix}${folderName}.md`) {
                    todoFiles.push(file);
                }
            }
        }

        return todoFiles;
    }

    /**
     * Check if a file is a PARA TODO file based on its path
     */
    isPARATodoFile(filePath: string): boolean {
        const normalizedPath = normalizePath(filePath);

        // Check if file is in a PARA folder
        const isInParaFolder = this.settings.paraFolders.some(folder =>
            normalizedPath.startsWith(folder + '/'));

        if (!isInParaFolder) return false;

        // Check if filename follows the pattern _TODO - {folderName}.md
        const pathParts = normalizedPath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const folderName = pathParts[pathParts.length - 2];

        return fileName === `${this.settings.todoNotePrefix}${folderName}.md`;
    }

    /**
     * Extract General todos from the master file
     */
    extractGeneralTodos(content: string): string[] {
        const lines = content.split('\n');
        const generalTodos: string[] = [];

        let inGeneralSection = false;

        for (const line of lines) {
            if (line.startsWith('# General')) {
                inGeneralSection = true;
                continue;
            }

            if (inGeneralSection && line.startsWith('#')) {
                // We've reached the next section
                break;
            }

            if (inGeneralSection && line.trim().startsWith('- [')) {
                generalTodos.push(line.trim());
            }
        }

        return generalTodos;
    }

    /**
     * Extract all TODO items from a file
     */
    extractTodos(content: string): string[] {
        const lines = content.split('\n');
        const todos: string[] = [];

        for (const line of lines) {
            if (line.trim().startsWith('- [')) {
                todos.push(line.trim());
            }
        }

        return todos;
    }

    /**
     * Parse the master file content into a structured object
     */
    parseMasterFileContent(content: string): any {
        const lines = content.split('\n');
        const sections: any = {
            General: []
        };

        let currentSection = 'General';
        let currentSubsection = '';

        for (const line of lines) {
            if (line.startsWith('# ') && line !== '# General') {
                currentSection = line.substring(2).trim();
                sections[currentSection] = {};
            } else if (line.startsWith('## ')) {
                currentSubsection = line.substring(3).trim();
                if (currentSection !== 'General') {
                    sections[currentSection][currentSubsection] = [];
                }
            } else if (line.trim().startsWith('- [')) {
                if (currentSection === 'General') {
                    sections.General.push(line.trim());
                } else if (currentSubsection) {
                    sections[currentSection][currentSubsection].push(line.trim());
                }
            }
        }

        return sections;
    }
}