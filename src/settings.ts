export interface ParaTodoSettings {
    masterTodoFilename: string;
    paraFolders: string[];
    todoNotePrefix: string;
    syncOnStartup: boolean;
    syncIntervalMinutes: number;
}

export const DEFAULT_SETTINGS: ParaTodoSettings = {
    masterTodoFilename: '_Master TODO List.md',
    paraFolders: ['_Projects', '_Areas', '_Resources', '_Archive'],
    todoNotePrefix: '_TODO - ',
    syncOnStartup: true,
    syncIntervalMinutes: 5
}