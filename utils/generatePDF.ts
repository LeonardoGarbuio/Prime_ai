import { jsPDF } from 'jspdf';

interface ReportData {
    score: number;
    potentialScore: number;
    faceShape: string;
    symmetry: number;
    skinQuality: number;
    archetype: string;
    pontosFraqueza?: string[];
    recomendacoes?: string[];
    analisecromatica?: {
        subtom?: string;
        tipo_de_pele?: string;
        cabelo?: {
            tipo?: string;
            textura?: string;
        };
    };
    guia_vestuario?: {
        cores_recomendadas?: string[];
        estilos?: string[];
        acessorios?: string[];
    };
}

export function generateVIPReport(data: ReportData): void {
    const doc = new jsPDF();

    // Cores
    const primaryColor: [number, number, number] = [57, 255, 20]; // Verde neon
    const textColor: [number, number, number] = [255, 255, 255];
    const bgColor: [number, number, number] = [5, 5, 5];
    const grayColor: [number, number, number] = [150, 150, 150];

    // Fundo preto
    doc.setFillColor(...bgColor);
    doc.rect(0, 0, 210, 297, 'F');

    // Header
    doc.setTextColor(...primaryColor);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PRIME AI', 20, 25);

    doc.setTextColor(...grayColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('DOSSIÊ COMPLETO DE VISAGISMO', 20, 33);

    // Linha separadora
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);

    // Score principal
    doc.setTextColor(...textColor);
    doc.setFontSize(48);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.score.toFixed(1)}`, 20, 65);

    doc.setTextColor(...grayColor);
    doc.setFontSize(12);
    doc.text('/10', 55, 65);

    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.text(`POTENCIAL: ${data.potentialScore.toFixed(1)}/10`, 20, 75);

    // Arquétipo
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`ARQUÉTIPO: ${data.archetype}`, 100, 60);

    doc.setTextColor(...grayColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Formato do rosto: ${data.faceShape}`, 100, 70);

    // Métricas
    let yPos = 95;

    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MÉTRICAS FACIAIS', 20, yPos);
    yPos += 10;

    // Simetria
    doc.setTextColor(...grayColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Simetria Facial: ${data.symmetry}%`, 20, yPos);

    // Barra de progresso simetria
    doc.setFillColor(50, 50, 50);
    doc.rect(100, yPos - 4, 80, 6, 'F');
    doc.setFillColor(...primaryColor);
    doc.rect(100, yPos - 4, (data.symmetry / 100) * 80, 6, 'F');
    yPos += 12;

    // Qualidade da pele
    doc.text(`Qualidade da Pele: ${data.skinQuality}%`, 20, yPos);
    doc.setFillColor(50, 50, 50);
    doc.rect(100, yPos - 4, 80, 6, 'F');
    doc.setFillColor(...primaryColor);
    doc.rect(100, yPos - 4, (data.skinQuality / 100) * 80, 6, 'F');
    yPos += 20;

    // Análise Cromática
    if (data.analisecromatica) {
        doc.setTextColor(...textColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISE CROMÁTICA', 20, yPos);
        yPos += 10;

        doc.setTextColor(...grayColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        if (data.analisecromatica.subtom) {
            doc.text(`Subtom: ${data.analisecromatica.subtom}`, 20, yPos);
            yPos += 7;
        }
        if (data.analisecromatica.tipo_de_pele) {
            doc.text(`Tipo de Pele: ${data.analisecromatica.tipo_de_pele}`, 20, yPos);
            yPos += 7;
        }
        if (data.analisecromatica.cabelo?.tipo) {
            doc.text(`Cabelo: ${data.analisecromatica.cabelo.tipo} - ${data.analisecromatica.cabelo.textura || ''}`, 20, yPos);
            yPos += 7;
        }
        yPos += 8;
    }

    // Guia de Vestuário
    if (data.guia_vestuario) {
        doc.setTextColor(...textColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('GUIA DE VESTUÁRIO', 20, yPos);
        yPos += 10;

        doc.setTextColor(...grayColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        if (data.guia_vestuario.cores_recomendadas?.length) {
            doc.text(`Cores: ${data.guia_vestuario.cores_recomendadas.slice(0, 4).join(', ')}`, 20, yPos);
            yPos += 7;
        }
        if (data.guia_vestuario.estilos?.length) {
            doc.text(`Estilos: ${data.guia_vestuario.estilos.slice(0, 3).join(', ')}`, 20, yPos);
            yPos += 7;
        }
        if (data.guia_vestuario.acessorios?.length) {
            doc.text(`Acessórios: ${data.guia_vestuario.acessorios.slice(0, 3).join(', ')}`, 20, yPos);
            yPos += 7;
        }
        yPos += 8;
    }

    // Pontos de Atenção
    if (data.pontosFraqueza?.length) {
        doc.setTextColor(...textColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PONTOS DE ATENÇÃO', 20, yPos);
        yPos += 10;

        doc.setTextColor(...grayColor);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        data.pontosFraqueza.slice(0, 5).forEach((ponto, i) => {
            const lines = doc.splitTextToSize(`• ${ponto}`, 170);
            doc.text(lines, 20, yPos);
            yPos += lines.length * 5 + 3;
        });
        yPos += 5;
    }

    // Recomendações
    if (data.recomendacoes?.length) {
        doc.setTextColor(...textColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RECOMENDAÇÕES PERSONALIZADAS', 20, yPos);
        yPos += 10;

        doc.setTextColor(...primaryColor);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        data.recomendacoes.slice(0, 4).forEach((rec, i) => {
            const lines = doc.splitTextToSize(`✓ ${rec}`, 170);
            doc.text(lines, 20, yPos);
            yPos += lines.length * 5 + 3;
        });
    }

    // Footer
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.text('Gerado por Prime AI - primeai-amber.vercel.app', 20, 285);
    doc.text(new Date().toLocaleDateString('pt-BR'), 170, 285);

    // Download
    doc.save('Prime_AI_Dossie_VIP.pdf');
}
