import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoVideplast from '../assets/videplast-brand.png';

/**
 * @param {Object} item - Objeto contendo os dados do ativo.
 * @param {string} motivo - Motivo selecionado para a baixa.
 * @param {string} observacoes - Observações e detalhamentos adicionais para a solicitação.
 */
export const gerarPdfBaixa = (item, motivo, observacoes = '') => {
  if (!item) {
    alert('Os dados do item não foram fornecidos para gerar o PDF.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const marginX = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const printableWidth = pageWidth - (2 * marginX);

  // CABEÇALHO
  try {
    doc.addImage(logoVideplast, 'PNG', marginX, 14, 45, 10);
  } catch (e) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(185, 28, 28);
    doc.text('VIDEPLAST', marginX, 22);
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text('SOLICITAÇÃO DE BAIXA DE BENS', pageWidth - marginX, 17, { align: 'right' });
  doc.setFontSize(9.5);
  doc.text('DO IMOBILIZADO (SBBI)', pageWidth - marginX, 22, { align: 'right' });

  doc.setDrawColor(185, 28, 28);
  doc.setLineWidth(0.8);
  doc.line(marginX, 27, pageWidth - marginX, 27);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR');
  doc.text(`Emissão: ${dataAtual} às ${horaAtual}`, pageWidth - marginX, 32, { align: 'right' });

  let currentY = 38;

  // MOTIVO DA BAIXA
  doc.setFillColor(242, 242, 242);
  doc.rect(marginX, currentY, printableWidth, 7, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('1. MOTIVO DA BAIXA', marginX + 3, currentY + 5);

  currentY += 13;

  const motivosValidos = ['Obsoleto', 'Quebra', 'Venda', 'Doação', 'Sinistro'];
  const colWidth = printableWidth / motivosValidos.length;

  motivosValidos.forEach((opcao, index) => {
    const xPos = marginX + (index * colWidth) + 3;

    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.3);
    doc.rect(xPos, currentY - 3, 4, 4);

    if (motivo && String(motivo).toLowerCase().trim() === opcao.toLowerCase().trim()) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(185, 28, 28);
      doc.text('X', xPos + 0.8, currentY + 0.2);
    }

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(opcao, xPos + 6, currentY + 0.2);
  });

  currentY += 10;

  // TABELA DE DADOS
  doc.setFillColor(242, 242, 242);
  doc.rect(marginX, currentY, printableWidth, 7, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('2. DADOS DO BEM ATIVO', marginX + 3, currentY + 5);

  currentY += 10;

  const formatField = (val) => val || 'N/A';
  const formatIncorporacao = (dateVal) => {
    if (!dateVal) return 'N/A';
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? String(dateVal) : parsed.toLocaleDateString('pt-BR');
  };

  const tableColumns = ['Nº Patrimônio', 'Subnº', 'Descrição do Bem', 'C.C. Origem', 'Incorporação'];
  const tableRows = [[
    formatField(item.codigo_imobilizado || item.codigo_inventario || item.Inventário || item.id),
    formatField(item['Subnº'] || item.sub_numero || '0'),
    formatField(item.descricao || item.Descrição),
    formatField(item.centro_custo || item.CentroCusto || item.centroCusto),
    formatIncorporacao(item.data_incorporacao || item.created_at)
  ]];

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: currentY,
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    bodyStyles: {
      font: 'Helvetica',
      fontSize: 8.5,
      cellPadding: 4,
      textColor: [50, 50, 50]
    },
    columnStyles: {
      0: { halign: 'center', width: 35 },
      1: { halign: 'center', width: 20 },
      2: { halign: 'left' },
      3: { halign: 'center', width: 35 },
      4: { halign: 'center', width: 30 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // OBSERVAÇÕES E DETALHAMENTO --
  doc.setFillColor(242, 242, 242);
  doc.rect(marginX, currentY, printableWidth, 7, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('3. OBSERVAÇÕES E DETALHAMENTO', marginX + 3, currentY + 5);

  currentY += 10;

  const boxHeight = 22;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(marginX, currentY, printableWidth, boxHeight);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);

  if (observacoes && observacoes.trim()) {
    doc.setTextColor(50, 50, 50);
    const splitText = doc.splitTextToSize(observacoes, printableWidth - 6);
    doc.text(splitText, marginX + 3, currentY + 5);
  } else {
    doc.setTextColor(140, 140, 140);
    doc.text('Descreva detalhadamente o estado atual do bem e a justificativa para sua baixa física...', marginX + 3, currentY + 5);
  }

  currentY += boxHeight + 10;

  // AUTORIZAÇÕES E ASSINATURAS
  doc.setFillColor(242, 242, 242);
  doc.rect(marginX, currentY, printableWidth, 7, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('4. AUTORIZAÇÕES E ASSINATURAS', marginX + 3, currentY + 5);

  currentY += 22;

  const sigWidth = 72;
  const xLeft = marginX + 8;
  const xRight = pageWidth - marginX - sigWidth - 8;

  // Responsável
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.4);
  doc.line(xLeft, currentY, xLeft + sigWidth, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('Responsável pela Solicitação', xLeft + (sigWidth / 2), currentY + 4.5, { align: 'center' });
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('(Nome legível e Assinatura)', xLeft + (sigWidth / 2), currentY + 8, { align: 'center' });

  // Autorização Diretor/Gerente
  doc.setLineWidth(0.4);
  doc.line(xRight, currentY, xRight + sigWidth, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('Autorização do Diretor / Gerente', xRight + (sigWidth / 2), currentY + 4.5, { align: 'center' });
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('(Assinatura sob Carimbo)', xRight + (sigWidth / 2), currentY + 8, { align: 'center' });

  currentY += 22;

  // Controle de Patrimônio e Data
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('Data: ____ / ____ / ________', xLeft, currentY - 1);

  doc.setLineWidth(0.4);
  doc.line(xRight, currentY - 5, xRight + sigWidth, currentY - 5);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('Visto Controle de Patrimônio', xRight + (sigWidth / 2), currentY - 0.5, { align: 'center' });

  const codPatrimonio = item.codigo_imobilizado || item.codigo_inventario || 'Ativo';
  const nomeArquivo = `SBBI_${codPatrimonio}.pdf`;
  doc.save(nomeArquivo);
};
