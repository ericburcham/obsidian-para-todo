import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

// Create a require function to import JSON files
const require = createRequire(import.meta.url);

// Reading the current versions
const manifest = require('./manifest.json');
const currentVersion = manifest.version;

// Split version by dots
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Bump patch version
const newVersion = `${major}.${minor}.${patch + 1}`;

// Update manifest.json
manifest.version = newVersion;
writeFileSync('./manifest.json', JSON.stringify(manifest, null, 2));

// Check if versions.json exists, create it if not
try {
    const versions = require('./versions.json');
    versions[newVersion] = manifest.minAppVersion;
    writeFileSync('./versions.json', JSON.stringify(versions, null, 2));
} catch (e) {
    const versions = { [newVersion]: manifest.minAppVersion };
    writeFileSync('./versions.json', JSON.stringify(versions, null, 2));
}

console.log(`Version bumped to ${newVersion}`);