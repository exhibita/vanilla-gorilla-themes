#!/usr/bin/env node
// Build a site from the Vanilla Gorilla template with each theme, and fail on a warning or a broken link.
// Usage: node scripts/check.mjs [--template <git URL or local folder>] [--branch <name>] [theme ...]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
        template: { type: 'string', default: 'https://github.com/exhibita/vanilla-gorilla.git' },
        branch: { type: 'string', default: 'main' }
    }
});

function run(command, args, cwd) {
    const result = spawnSync(command, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' });
    return { status: result.status, output: `${result.stdout || ''}${result.stderr || ''}` };
}

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
    });
}

// Return the relative links and asset paths of a built site that point to no file.
function brokenLinks(dist) {
    const broken = [];
    for (const file of walk(dist).filter(name => name.endsWith('.html'))) {
        const html = fs.readFileSync(file, 'utf8');
        for (const match of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
            const target = match[1].split('#')[0].split('?')[0];
            if (!target || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue;
            let resolved = path.resolve(path.dirname(file), decodeURI(target));
            if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) resolved = path.join(resolved, 'index.html');
            if (!fs.existsSync(resolved)) broken.push(`${path.relative(dist, file)} -> ${match[1]}`);
        }
    }
    return broken;
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'vg-themes-'));
const template = path.join(work, 'template');

// 1. Get the template.
if (fs.existsSync(values.template)) {
    fs.cpSync(values.template, template, {
        recursive: true,
        filter: source => !['node_modules', '.git', 'dist'].includes(path.basename(source))
    });
    const modules = path.join(values.template, 'node_modules');
    if (fs.existsSync(modules)) fs.symlinkSync(path.resolve(modules), path.join(template, 'node_modules'), 'junction');
} else {
    const clone = run('git', ['clone', '--depth', '1', '--branch', values.branch, values.template, template]);
    if (clone.status !== 0) {
        console.error(clone.output);
        process.exit(1);
    }
}
if (!fs.existsSync(path.join(template, 'node_modules'))) {
    const install = run('npm', ['ci'], template);
    if (install.status !== 0) {
        console.error(install.output);
        process.exit(1);
    }
}
const templateVersion = JSON.parse(fs.readFileSync(path.join(template, 'package.json'), 'utf8')).vanillaGorilla?.templateVersion ?? 0;
console.log(`Template version ${templateVersion}.`);

// 2. Build one site for each theme.
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'themes.json'), 'utf8'));
const themes = manifest.themes.filter(theme => positionals.length === 0 || positionals.includes(theme.name));
let failures = 0;

for (const theme of themes) {
    const problems = [];
    const site = path.join(work, theme.name);
    fs.cpSync(template, site, { recursive: true, filter: source => path.basename(source) !== 'node_modules' });
    fs.symlinkSync(path.join(template, 'node_modules'), path.join(site, 'node_modules'), 'junction');

    for (const relative of manifest.replaces) {
        fs.rmSync(path.join(site, 'src', relative), { recursive: true, force: true });
    }
    fs.cpSync(path.join(ROOT, theme.path), path.join(site, 'src'), { recursive: true });

    if (templateVersion < theme.minTemplateVersion) {
        problems.push(`needs template version ${theme.minTemplateVersion}`);
    }
    const build = run('npm', ['run', 'build'], site);
    if (build.status !== 0) problems.push(`build exit code ${build.status}`);
    const warnings = build.output.split('\n').filter(line => /warning|error/i.test(line));
    problems.push(...warnings.map(line => `build: ${line.trim()}`));

    const dist = path.join(site, 'dist');
    let pages = 0;
    if (fs.existsSync(dist)) {
        pages = walk(dist).filter(name => name.endsWith('index.html')).length;
        problems.push(...brokenLinks(dist).map(link => `broken link: ${link}`));
    }
    if (pages === 0) problems.push('no pages were built');

    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${theme.name.padEnd(14)} ${pages} pages`);
    for (const problem of problems) console.log(`       ${problem}`);
    if (problems.length) failures += 1;
}

fs.rmSync(work, { recursive: true, force: true });
if (failures) {
    console.error(`\n${failures} of ${themes.length} themes failed.`);
    process.exit(1);
}
console.log(`\nAll ${themes.length} themes build with no warnings and no broken links.`);
