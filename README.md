# PARA TODO Plugin for Obsidian

This plugin helps you manage your TODO items across your PARA system folders in Obsidian.

## Features

- Collects TODO items from specific notes in your PARA structure
- Creates a master TODO list in your vault root
- Syncs changes bidirectionally between individual TODO notes and the master list

## Installation

- Clone this repository to your `.obsidian/plugins/` folder
- Run `npm install` and `npm run build`
- Enable the plugin in Obsidian settings

## Usage

1. Create TODO notes in your PARA subfolders following the naming pattern: `_TODO - {subfolder}.md`
2. Add checkbox items using the Obsidian syntax: `- [ ] Task description`
3. The plugin will automatically sync these items to a master TODO list

## License

MIT
