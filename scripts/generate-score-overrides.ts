/**
 * Script para gerar arquivo de override de notas
 * 
 * USO:
 * 1. Coloque as fotos na pasta temp-scores/
 * 2. Nomeie cada foto como: NOTA_qualquernome.jpg (ex: 9.5_foto1.jpg)
 * 3. Execute: npx ts-node scripts/generate-score-overrides.ts
 * 4. O arquivo lib/score-overrides.json será gerado
 * 
 * Para APAGAR: Delete o arquivo lib/score-overrides.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const SCORES_FOLDER = path.join(__dirname, '..', 'temp-scores');
const OUTPUT_FILE = path.join(__dirname, '..', 'lib', 'score-overrides.json');

interface ScoreOverride {
    hash: string;
    nota: number;
    arquivo: string;
}

function generateImageHash(imagePath: string): string {
    const buffer = fs.readFileSync(imagePath);
    return crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
}

function extractNota(filename: string): number | null {
    // Formato esperado: 9.5_nome.jpg ou 9_nome.png
    const match = filename.match(/^(\d+\.?\d*)_/);
    if (match) {
        return parseFloat(match[1]);
    }
    return null;
}

async function main() {
    console.log('🔍 Procurando imagens em:', SCORES_FOLDER);

    if (!fs.existsSync(SCORES_FOLDER)) {
        fs.mkdirSync(SCORES_FOLDER, { recursive: true });
        console.log('📁 Pasta criada:', SCORES_FOLDER);
        console.log('👉 Coloque as fotos lá com formato: NOTA_nome.jpg');
        console.log('   Exemplo: 9.5_foto1.jpg, 8.0_foto2.png');
        return;
    }

    const files = fs.readdirSync(SCORES_FOLDER);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const imageFiles = files.filter(f =>
        imageExtensions.includes(path.extname(f).toLowerCase())
    );

    if (imageFiles.length === 0) {
        console.log('❌ Nenhuma imagem encontrada em', SCORES_FOLDER);
        return;
    }

    const overrides: Record<string, ScoreOverride> = {};

    for (const file of imageFiles) {
        const nota = extractNota(file);
        if (nota === null) {
            console.log(`⚠️ Ignorando ${file} - nome deve ser NOTA_nome.jpg`);
            continue;
        }

        const imagePath = path.join(SCORES_FOLDER, file);
        const hash = generateImageHash(imagePath);

        overrides[hash] = {
            hash,
            nota,
            arquivo: file
        };

        console.log(`✅ ${file} → hash: ${hash}, nota: ${nota}`);
    }

    // Salvar JSON
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(overrides, null, 2));
    console.log('\n📄 Arquivo gerado:', OUTPUT_FILE);
    console.log(`   Total: ${Object.keys(overrides).length} overrides`);
}

main().catch(console.error);
