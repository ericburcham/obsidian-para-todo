import { App, PluginSettingTab, Setting } from 'obsidian';
import ParaTodoPlugin from './main';

export class ParaTodoSettingTab extends PluginSettingTab {
    plugin: ParaTodoPlugin;

    constructor(app: App, plugin: ParaTodoPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'PARA TODO Settings'});

        new Setting(containerEl)
            .setName('Master TODO filename')
            .setDesc('The filename for the master TODO list (include .md extension)')
            .addText(text => text
                .setPlaceholder('_Master TODO List.md')
                .setValue(this.plugin.settings.masterTodoFilename)
                .onChange(async (value) => {
                    this.plugin.settings.masterTodoFilename = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('PARA Folders')
            .setDesc('Comma-separated list of root PARA folders to scan for TODO notes')
            .addText(text => text
                .setPlaceholder('_Projects,_Areas,_Resources,_Archive')
                .setValue(this.plugin.settings.paraFolders.join(','))
                .onChange(async (value) => {
                    this.plugin.settings.paraFolders = value.split(',').map(f => f.trim());
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('TODO Note Prefix')
            .setDesc('The prefix for individual TODO notes (will be followed by folder name)')
            .addText(text => text
                .setPlaceholder('_TODO - ')
                .setValue(this.plugin.settings.todoNotePrefix)
                .onChange(async (value) => {
                    this.plugin.settings.todoNotePrefix = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Sync on Startup')
            .setDesc('Automatically sync TODOs when Obsidian starts')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.syncOnStartup)
                .onChange(async (value) => {
                    this.plugin.settings.syncOnStartup = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Sync Interval (minutes)')
            .setDesc('How often to automatically sync TODOs (0 to disable)')
            .addSlider(slider => slider
                .setLimits(0, 60, 5)
                .setValue(this.plugin.settings.syncIntervalMinutes)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.syncIntervalMinutes = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('button', {
            text: 'Force Sync Now',
            cls: 'mod-cta',
        }).addEventListener('click', () => {
            this.plugin.syncTodos();
        });
    }
}