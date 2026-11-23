#!/usr/bin/env node
// Make each installable theme folder (themes/<name>/) and themes.json from src/.
// A theme folder = the shared base of its type + the theme's own files.
// Usage: node scripts/assemble.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_THEMES = path.join(ROOT, 'src', 'themes');
const SRC_BASES = path.join(ROOT, 'src', 'bases');
const OUT = path.join(ROOT, 'themes');
const TEXT_EXTENSIONS = new Set(['.html', '.md', '.css', '.js', '.json']);

// Paths under src/ of the template that a theme replaces. The CLI removes them before it copies a theme.
const REPLACES = [
    'blog', 'gallery', 'links', 'test-page', 'templates', 'skeletons', 'index.html',
    'images/blog', 'images/gallery', 'images/create-vanilla-gorilla-screenshot.png'
];

// Files in a theme source folder that are not copied as they are.
const THEME_SOURCE_ONLY = new Set(['theme.json', 'tokens.css', 'style.css']);
// Files in a base folder that are not copied as they are.
const BASE_SOURCE_ONLY = new Set(['_core.css', 'defaults.json']);

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
    });
}

function copyTree(from, to, skip) {
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
        if (skip.has(entry.name)) continue;
        fs.cpSync(path.join(from, entry.name), path.join(to, entry.name), { recursive: true });
    }
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function assemble(name) {
    const themeDir = path.join(SRC_THEMES, name);
    const theme = readJson(path.join(themeDir, 'theme.json'));
    const baseDir = path.join(SRC_BASES, theme.type);
    if (!fs.existsSync(baseDir)) throw new Error(`${name}: no base for type "${theme.type}"`);

    const defaultsFile = path.join(baseDir, 'defaults.json');
    const tokens = { ...(fs.existsSync(defaultsFile) ? readJson(defaultsFile) : {}), ...theme.tokens };

    const out = path.join(OUT, name);
    fs.mkdirSync(out, { recursive: true });
    copyTree(baseDir, out, BASE_SOURCE_ONLY);
    copyTree(themeDir, out, THEME_SOURCE_ONLY);

    const css = [
        `/*\n * ${theme.title} - a Vanilla Gorilla theme\n * ${theme.description}\n * Edit this file. Never edit style.min.css. The build regenerates it.\n */\n`,
        `@import url('${theme.fonts}');\n`,
        fs.readFileSync(path.join(themeDir, 'tokens.css'), 'utf8').trim(),
        fs.readFileSync(path.join(baseDir, '_core.css'), 'utf8'),
        `/* ---------- ${theme.title} ---------- */`
    ].join('\n') + '\n' + fs.readFileSync(path.join(themeDir, 'style.css'), 'utf8');
    fs.mkdirSync(path.join(out, 'css'), { recursive: true });
    fs.writeFileSync(path.join(out, 'css', 'style.css'), css);

    for (const file of walk(out)) {
        if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
        let text = fs.readFileSync(file, 'utf8');
        for (const [key, value] of Object.entries(tokens)) {
            text = text.replaceAll(`{{${key}}}`, value);
        }
        const left = text.match(/\{\{[A-Z0-9_]+\}\}/g);
        if (left) throw new Error(`${name}: ${path.relative(out, file)} has tokens with no value: ${[...new Set(left)].join(', ')}`);
        fs.writeFileSync(file, text);
    }

    return {
        name,
        title: theme.title,
        type: theme.type,
        description: theme.description,
        path: `themes/${name}`,
        preview: `previews/${name}.jpg`,
        minTemplateVersion: theme.minTemplateVersion
    };
}

const order = readJson(path.join(ROOT, 'src', 'order.json'));
const names = fs.readdirSync(SRC_THEMES).filter(name => fs.existsSync(path.join(SRC_THEMES, name, 'theme.json')));
const missing = names.filter(name => !order.includes(name));
if (missing.length) throw new Error(`Add these themes to src/order.json: ${missing.join(', ')}`);

fs.rmSync(OUT, { recursive: true, force: true });
const themes = order.filter(name => names.includes(name)).map(assemble);
fs.writeFileSync(
    path.join(ROOT, 'themes.json'),
    JSON.stringify({ manifestVersion: 1, replaces: REPLACES, themes }, null, 2) + '\n'
);
console.log(`Assembled ${themes.length} themes.`);
