import { Plugin } from 'obsidian';
import { ParaTodoSettings, DEFAULT_SETTINGS } from './settings';
import { ParaTodoSettingTab } from './settingsTab';
import { TodoCollector } from './todoCollector';
import { TodoSynchronizer } from './todoSynchronizer';

export default class ParaTodoPlugin extends Plugin {
    settings: ParaTodoSettings;
    private todoCollector: TodoCollector;
    private todoSynchronizer: TodoSynchronizer;
    private syncIntervalId: number | null = null;

    async onload() {
        await this.loadSettings();

        // Initialize modules
        this.todoCollector = new TodoCollector(this.app, this.settings);
        this.todoSynchronizer = new TodoSynchronizer(this.app, this.settings, this.todoCollector);

        // Add ribbon icon for manual sync
        this.addRibbonIcon('checkmark', 'Sync PARA TODOs', () => {
            this.todoSynchronizer.syncTodos();
        });

        // Add settings tab
        this.addSettingTab(new ParaTodoSettingTab(this.app, this));

        // Register commands
        this.addCommand({
            id: 'sync-para-todos',
            name: 'Sync PARA TODOs',
            callback: () => {
                this.todoSynchronizer.syncTodos();
            }
        });

        // Set up file modification listeners
        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                this.todoSynchronizer.handleFileModification(file);
            })
        );

        // Sync on startup if enabled
        if (this.settings.syncOnStartup) {
            // Wait a bit for the app to fully load
            setTimeout(() => {
                this.todoSynchronizer.syncTodos();
            }, 2000);
        }

        // Set up interval sync if enabled
        this.setupSyncInterval();
    }

    setupSyncInterval() {
        // Clear any existing interval
        if (this.syncIntervalId !== null) {
            window.clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
        }

        // Set up new interval if enabled
        if (this.settings.syncIntervalMinutes > 0) {
            const milliseconds = this.settings.syncIntervalMinutes * 60 * 1000;
            this.syncIntervalId = window.setInterval(() => {
                this.todoSynchronizer.syncTodos();
            }, milliseconds);
        }
    }

    onunload() {
        // Clear interval if it exists
        if (this.syncIntervalId !== null) {
            window.clearInterval(this.syncIntervalId);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.setupSyncInterval(); // Update interval if settings changed
    }
}