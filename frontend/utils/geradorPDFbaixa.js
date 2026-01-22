import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateWriteOffPDF = (item, user) => {
  const doc = new jsPDF();
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Solicitação de Baixa de Bens do Imobilizado", 105, 15, { align: "center" });
  doc.text("(SBBI)", 105, 22, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Motivo da Baixa:", 14, 35);
  
  doc.setFont("helvetica", "normal");
  doc.rect(14, 40, 4, 4); doc.text("Baixa - Obsoleto", 20, 43);
  doc.rect(60, 40, 4, 4); doc.text("Baixa - Quebra", 66, 43);
  doc.rect(110, 40, 4, 4); doc.text("Baixa - Venda", 116, 43);
  
  doc.rect(14, 48, 4, 4); doc.text("Baixa - Doação", 20, 51);
  doc.rect(60, 48, 4, 4); doc.text("Baixa - Sinistro", 66, 51);

  doc.setFontSize(9);
  doc.text("Obs.: Para venda é necessário nota fiscal", 110, 51);

  const today = new Date().toLocaleDateString('pt-BR');
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Data da Solicitação:", 14, 60);
  doc.setFont("helvetica", "normal");
  doc.text(today, 50, 60);

  const tableHead = [
    ["Nº Patrimônio", "Subnº", "Descrição do Bem\n(Tipo, Modelo, Fabricação)", "C.C. Origem", "Incorporação"]
  ];

  const tableBody = [
    [
      item.Inventário || item.codigo_imobilizado || "",
      item['Subnº'] || "0",
      item.Descrição || "",
      item.CentroCusto || "",
      item.Data || ""
    ]
  ];

  autoTable(doc, {
    startY: 65,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2, valign: 'middle', halign: 'center' },
    headStyles: { fillColor: [220, 220, 220], textColor: 20, lineWidth: 0.1, lineColor: 10 },
    columnStyles: {
      2: { cellWidth: 80 }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.text("Observações:", 14, finalY);
  doc.setFont("helvetica", "normal");
  doc.text("Não atende mais as necessidades da empresa (obsoleto).", 14, finalY + 6);

  const signatureY = finalY + 40;
  
  doc.line(14, signatureY, 90, signatureY);
  doc.setFont("helvetica", "bold");
  doc.text("Autorização do Diretor / Gerente", 52, signatureY + 5, { align: "center" });
  
  doc.line(110, signatureY, 190, signatureY);
  doc.text("Responsável (Solicitante)", 150, signatureY + 5, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.text(`Usuário: ${user?.nome || user?.cracha || 'N/A'}`, 150, signatureY + 10, { align: "center" });
  doc.text(`Crachá: ${user?.cracha || ''}`, 150, signatureY + 15, { align: "center" });

  doc.save(`Solicitacao_Baixa_${item.Inventário || 'Item'}.pdf`);
};