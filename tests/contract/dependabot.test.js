import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('contract/dependabot - Configuración de Dependabot presente y válida en .github/dependabot.yml', () => {
    const rootDir = process.cwd();
    const configPath = path.join(rootDir, '.github', 'dependabot.yml');

    assert.ok(fs.existsSync(configPath), 'El archivo .github/dependabot.yml debe existir');

    const content = fs.readFileSync(configPath, 'utf8');

    // 1. Validar version 2
    assert.ok(content.includes('version: 2'), 'Dependabot config debe usar version 2');

    // 2. Validar ecosistema npm
    assert.ok(content.includes('package-ecosystem: "npm"'), 'Debe incluir ecosistema npm');

    // 3. Validar ecosistema github-actions
    assert.ok(content.includes('package-ecosystem: "github-actions"'), 'Debe incluir ecosistema github-actions');

    // 4. Validar programación periódica
    assert.ok(content.includes('interval: "weekly"'), 'Debe programarse con intervalo semanal');
});

test('contract/github-actions - update-fallback.yml se ejecuta 1 vez al día', () => {
    const rootDir = process.cwd();
    const workflowPath = path.join(rootDir, '.github', 'workflows', 'update-fallback.yml');

    assert.ok(fs.existsSync(workflowPath), 'El archivo update-fallback.yml debe existir');
    const content = fs.readFileSync(workflowPath, 'utf8');

    // Validar que se ejecuta 1 vez al día (no cada 12 horas)
    assert.ok(!content.includes('*/12'), 'No debe ejecutarse cada 12 horas');
    assert.ok(/cron:\s*['"]\d+\s+\d+\s+\*\s+\*\s+\*['"]/.test(content), 'Debe tener una expresión cron diaria (1 vez al día)');
});

