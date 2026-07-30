import { execSync } from 'node:child_process';
import { APP_VERSION } from '../src/config/config.js';

const tagName = `v${APP_VERSION}`;

console.log(`🏷️  Comprobando versión actual del proyecto: ${tagName}`);

try {
    // 1. Comprobar si el tag ya existe localmente
    const existingTags = execSync(`git tag -l "${tagName}"`, { encoding: 'utf8' }).trim();

    if (existingTags === tagName) {
        console.log(`ℹ️  El tag ${tagName} ya existe localmente.`);
    } else {
        console.log(`✨ Creando nuevo tag Git: ${tagName}...`);
        execSync(`git tag -a "${tagName}" -m "Release ${tagName}"`, { stdio: 'inherit' });
        console.log(`✅ Tag ${tagName} creado localmente.`);
    }

    // 2. Comprobar si el tag ya fue subido a origin
    const remoteTags = execSync(`git ls-remote --tags origin refs/tags/${tagName}`, { encoding: 'utf8' }).trim();

    if (remoteTags.includes(tagName)) {
        console.log(`ℹ️  El tag ${tagName} ya está publicado en GitHub origin.`);
    } else {
        console.log(`🚀 Subiendo tag ${tagName} a GitHub origin...`);
        execSync(`git push origin "${tagName}"`, { stdio: 'inherit' });
        console.log(`🎉 Tag ${tagName} publicado con éxito en GitHub.`);
    }
} catch (err) {
    console.error(`❌ Error al gestionar el tag ${tagName}:`, err.message || err);
    process.exit(1);
}
