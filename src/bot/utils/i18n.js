import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const es = JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/es.json'), 'utf-8'));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/en.json'), 'utf-8'));

const locales = { es, en };

export function t(language, key, variables = {}) {
    const lang = locales[language] ? language : 'es'; // default to 'es'
    let text = locales[lang][key] || locales['es'][key] || key;

    for (const [varName, varValue] of Object.entries(variables)) {
        text = text.replace(new RegExp(`\\{${varName}\\}`, 'g'), varValue);
    }

    return text;
}
