import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputFile = 'mapping.txt';
const rootDir = __dirname;

const ignoredDirs = new Set([
    'node_modules',
    '.git',
    '.vscode',
    '.idea',
    '.agent',
    'dist',
    'build',
    'target',
    'gen',
    'binaries',
    'icons',
    '__pycache__',
    'coverage',
    'public',
    'assets',
    '.github',
    '.tauri',
]);

const ignoredFiles = new Set([
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'Cargo.lock',
    '.DS_Store',
    'mapping.txt',
    'mapping.js',
    'backend.txt',
    'frontend.txt',
    'vite-env.d.ts',
    '.gitignore',
    '.eslintrc.cjs',
    '.eslintrc.json',
    '.prettierrc',
]);

const allowedExtensions = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.rs',
    '.py',
    '.go',
    '.html', '.css', '.scss', '.sass', '.less',
    '.json', '.toml', '.yaml', '.yml',
    '.md',
    '.sh', '.bat', '.ps1'
]);

const MAX_FILE_SIZE = 100 * 1024;

function isDirIgnored(dirName) {
    return ignoredDirs.has(dirName);
}

function isFileIgnored(fileName) {
    return ignoredFiles.has(fileName);
}

function shouldDumpContent(fileName, fileSize) {
    if (fileSize > MAX_FILE_SIZE) return false;

    const ext = path.extname(fileName).toLowerCase();

    if (fileName.endsWith('.min.js') || fileName.endsWith('.min.css')) return false;

    return allowedExtensions.has(ext);
}

function generateTree(dir, prefix = '') {
    let output = '';
    let items;

    try {
        items = fs.readdirSync(dir);
    } catch (e) {
        return '';
    }

    const filteredItems = items.filter(item => {
        if (ignoredDirs.has(item)) return false;
        if (ignoredFiles.has(item)) return false;
        if (item.startsWith('.')) return false;
        return true;
    });

    filteredItems.sort((a, b) => {
        const aPath = path.join(dir, a);
        const bPath = path.join(dir, b);
        let aStat, bStat;
        try {
            aStat = fs.statSync(aPath);
            bStat = fs.statSync(bPath);
        } catch (e) { return 0; }

        if (aStat.isDirectory() && !bStat.isDirectory()) return -1;
        if (!aStat.isDirectory() && bStat.isDirectory()) return 1;
        return a.localeCompare(b);
    });

    filteredItems.forEach((item, index) => {
        const fullPath = path.join(dir, item);
        let stats;
        try {
            stats = fs.statSync(fullPath);
        } catch (e) { return; }

        const isLast = index === filteredItems.length - 1;
        const connector = isLast ? '└── ' : '├── ';

        output += `${prefix}${connector}${item}`;
        if (stats.isDirectory()) {
            output += '/';
        }
        output += '\n';

        if (stats.isDirectory()) {
            output += generateTree(fullPath, prefix + (isLast ? '    ' : '│   '));
        }
    });

    return output;
}

function getFileContents(dir) {
    let output = '';
    let items;

    try {
        items = fs.readdirSync(dir);
    } catch (e) {
        return '';
    }

    const filteredItems = items.filter(item => {
        if (ignoredDirs.has(item)) return false;
        if (ignoredFiles.has(item)) return false;
        if (item.startsWith('.')) return false;
        return true;
    });

    for (const item of filteredItems) {
        const fullPath = path.join(dir, item);
        let stats;
        try {
            stats = fs.statSync(fullPath);
        } catch (e) { continue; }

        if (stats.isDirectory()) {
            output += getFileContents(fullPath);
        } else {
            if (shouldDumpContent(item, stats.size)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    output += '\n' + '='.repeat(60) + '\n';
                    output += `FILE: ${path.relative(rootDir, fullPath)}\n`;
                    output += '='.repeat(60) + '\n';
                    output += content + '\n';
                } catch (err) {
                    console.error(`Error reading ${fullPath}: ${err.message}`);
                }
            }
        }
    }
    return output;
}

function main() {
    console.log('Generating optimized project map...');

    let finalOutput = '';

    finalOutput += 'PROJECT STRUCTURE:\n';
    finalOutput += '='.repeat(20) + '\n';
    finalOutput += generateTree(rootDir);
    finalOutput += '\n\n';

    finalOutput += 'FILE CONTENTS:\n';
    finalOutput += '='.repeat(20) + '\n';
    finalOutput += getFileContents(rootDir);

    fs.writeFileSync(outputFile, finalOutput);
    console.log(`Successfully generated '${outputFile}'`);

    const stats = fs.statSync(outputFile);
    console.log(`Output size: ${(stats.size / 1024).toFixed(2)} KB`);
}

main();
