import { App, TFile, normalizePath } from 'obsidian';
import { ParaTodoSettings } from './settings';
import { TodoCollector } from './todoCollector';

/**
 * Handles synchronization of TODO items between files
 */
export class TodoSynchronizer {
    constructor(
        private app: App,
        private settings: ParaTodoSettings,
        private todoCollector: TodoCollector
    ) {}

    /**
     * Main function to synchronize TODOs between individual files and the master list
     */
    async syncTodos() {
        console.log('Syncing PARA TODOs...');

        // Get all TODO files and their content
        const todoFiles = await this.todoCollector.findAllTodoFiles();

        // Parse all TODO items from the files
        const todoStructure = await this.parseTodoStructure(todoFiles);

        // Generate master TODO file content
        const masterContent = this.generateMasterTodoContent(todoStructure);

        // Create or update the master TODO file
        await this.updateMasterTodoFile(masterContent);

        console.log('PARA TODOs synced successfully');
    }

    /**
     * Handle file modifications - check if it's a TODO file and sync if needed
     */
    async handleFileModification(file: TFile) {
        // Check if this is a TODO file we care about
        if (!(file instanceof TFile) || !file.path.endsWith('.md')) {
            return;
        }

        // Check if it's the master file
        const masterPath = normalizePath(this.settings.masterTodoFilename);
        if (file.path === masterPath) {
            await this.syncFromMasterToIndividual();
            return;
        }

        // Check if it's a PARA TODO file
        const isPARATodoFile = this.todoCollector.isPARATodoFile(file.path);
        if (isPARATodoFile) {
            await this.syncTodos();
        }
    }

    /**
     * Parse TODO items from all files into a structured object
     */
    async parseTodoStructure(todoFiles: TFile[]): Promise<any> {
        const structure: any = {
            General: []
        };

        // First, get the General section from the master file if it exists
        const masterFile = this.app.vault.getAbstractFileByPath(this.settings.masterTodoFilename);
        if (masterFile instanceof TFile) {
            const content = await this.app.vault.read(masterFile);
            const generalItems = this.todoCollector.extractGeneralTodos(content);
            structure.General = generalItems;
        }

        // Then parse all the individual TODO files
        for (const file of todoFiles) {
            const content = await this.app.vault.read(file);
            const todos = this.todoCollector.extractTodos(content);

            // Determine the section and subsection from the file path
            const pathParts = file.path.split('/');
            const mainFolder = pathParts[0]; // e.g., _Projects
            const subFolder = pathParts[pathParts.length - 2]; // e.g., project1

            // Create main folder section if it doesn't exist
            if (!structure[mainFolder]) {
                structure[mainFolder] = {};
            }

            // Add todos under the proper subsection
            structure[mainFolder][subFolder] = todos;
        }

        return structure;
    }

    /**
     * Generate the content for the master TODO file
     */
    generateMasterTodoContent(structure: any): string {
        let content = '# General\n';

        // Add General todos
        for (const todo of structure.General) {
            content += todo + '\n';
        }

        content += '\n';

        // Add PARA sections
        for (const folder of this.settings.paraFolders) {
            if (structure[folder]) {
                content += `# ${folder}\n`;

                // Add subsections for each subfolder
                for (const subFolder in structure[folder]) {
                    content += `## ${subFolder}\n`;

                    // Add todos for this subsection
                    for (const todo of structure[folder][subFolder]) {
                        content += todo + '\n';
                    }

                    content += '\n';
                }
            }
        }

        return content;
    }

    /**
     * Create or update the master TODO file
     */
    async updateMasterTodoFile(content: string) {
        const masterPath = this.settings.masterTodoFilename;
        const normalizedPath = normalizePath(masterPath);

        // Check if file exists
        const existingFile = this.app.vault.getAbstractFileByPath(normalizedPath);

        if (existingFile instanceof TFile) {
            // Update existing file
            await this.app.vault.modify(existingFile, content);
        } else {
            // Create new file
            await this.app.vault.create(normalizedPath, content);
        }
    }

    /**
     * Sync changes from the master file back to individual TODO files
     */
    async syncFromMasterToIndividual() {
        const masterFile = this.app.vault.getAbstractFileByPath(this.settings.masterTodoFilename);
        if (!(masterFile instanceof TFile)) {
            return;
        }

        const content = await this.app.vault.read(masterFile);
        const sections = this.todoCollector.parseMasterFileContent(content);

        // Update each individual TODO file
        for (const paraFolder in sections) {
            // Skip General section
            if (paraFolder === 'General') continue;

            for (const subFolder in sections[paraFolder]) {
                const todoFilePath = `${paraFolder}/${subFolder}/${this.settings.todoNotePrefix}${subFolder}.md`;
                const normalizedPath = normalizePath(todoFilePath);

                const todoFile = this.app.vault.getAbstractFileByPath(normalizedPath);
                if (todoFile instanceof TFile) {
                    // Generate content for this individual TODO file
                    let todoContent = `# ${subFolder} TODOs\n\n`;
                    for (const todo of sections[paraFolder][subFolder]) {
                        todoContent += todo + '\n';
                    }

                    // Update the file
                    await this.app.vault.modify(todoFile, todoContent);
                }
            }
        }
    }
}