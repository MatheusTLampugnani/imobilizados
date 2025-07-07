import React, { useEffect, useState } from 'react';
import { Modal, Button, ListGroup, Badge, Alert, Spinner } from 'react-bootstrap';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DivergenceReport = ({ show, onClose, collectedItems, expectedItems, inventoryCc }) => {
  const [missingItems, setMissingItems] = useState([]);
  const [wrongCcItems, setWrongCcItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(null);

  useEffect(() => {
    if (show) {
      const formatCode = (item) => String(item.Inventário || item.Série || item.codigo_imobilizado || '').trim().replace(/\.0$/, '').replace(/^0+/, '');
      const collectedIds = new Set(collectedItems.map(item => formatCode(item)));

      const missing = expectedItems.filter(expectedItem => {
        const expectedCode = formatCode(expectedItem);
        return !collectedIds.has(expectedCode);
      });
      setMissingItems(missing);

      const wrongCc = collectedItems.filter(collectedItem => {
        const collectedCc = String(collectedItem.CentroCusto || '').trim().replace(/\.0$/, '').replace(/^0+/, '');
        const currentInventoryCc = String(inventoryCc || '').trim().replace(/\.0$/, '').replace(/^0+/, '');
        
        const isExpectedForCurrentCc = expectedItems.some(expectedItem => 
            formatCode(expectedItem) === formatCode(collectedItem) && 
            String(expectedItem.CentroCusto || '').trim().replace(/\.0$/, '').replace(/^0+/, '') === currentInventoryCc
        );

        return !isExpectedForCurrentCc && collectedCc !== currentInventoryCc;
      });
      setWrongCcItems(wrongCc);
    }
  }, [show, collectedItems, expectedItems, inventoryCc]);

  const handleGenerateReport = async (format) => {
    setIsGenerating(format);
    await new Promise(resolve => setTimeout(resolve, 50)); // Pequeno delay para UI atualizar

    const doc = new jsPDF();
    const tableRows = [];
    const tableColumns = ["Status", "Plaqueta", "Subnº", "Descrição", "Centro de Custo"];

    // Adiciona um título ao documento
    doc.setFontSize(18);
    doc.text(`Relatório de Divergências - CC: ${inventoryCc}`, 14, 22);
    doc.setFontSize(11);

    missingItems.forEach(item => {
        tableRows.push([
            "Faltante",
            item.Inventário || 'N/A',
            item['Subnº'] || 'N/A',
            item.Descrição || 'Sem descrição',
            item.CentroCusto || 'N/A'
        ]);
    });

    wrongCcItems.forEach(item => {
        tableRows.push([
            "CC Errado",
            item.Inventário || 'N/A',
            item['Subnº'] || 'N/A',
            item.Descrição || 'Sem descrição',
            item.CentroCusto || 'N/A'
        ]);
    });
    
    if (format === 'pdf') {
        doc.autoTable(tableColumns, tableRows, {
            startY: 30,
            didDrawCell: (data) => {
                const status = data.row.raw[0];
                if (status === 'Faltante') {
                    doc.setFillColor(255, 235, 238); // Vermelho claro
                } else if (status === 'CC Errado') {
                    doc.setFillColor(255, 248, 225); // Amarelo claro
                }
            },
            styles: {
                fillColor: [255, 255, 255] // Cor de preenchimento padrão (branco)
            },
            headStyles: {
                fillColor: [52, 58, 64], // Cabeçalho escuro
                textColor: [255, 255, 255]
            }
        });
        doc.save(`Relatorio_Divergencias_CC_${inventoryCc}.pdf`);
    }

    if (format === 'csv') {
        let csvContent = "data:text/csv;charset=utf-8," 
            + tableColumns.join(";") + "\n" 
            + tableRows.map(e => e.join(";")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Relatorio_Divergencias_CC_${inventoryCc}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    setIsGenerating(null);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="xl" backdrop="static">
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>📊 Relatório de Divergências do Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {missingItems.length === 0 && wrongCcItems.length === 0 && (
          <Alert variant="success" className="text-center">
            🎉 Nenhuma divergência encontrada! Inventário perfeito para o Centro de Custo {inventoryCc}.
          </Alert>
        )}

        {missingItems.length > 0 && (
          <div className="mb-4">
            <h5>❌ Itens Faltantes ({missingItems.length})</h5>
            <p className="text-muted">Estes itens deveriam estar no Centro de Custo {inventoryCc}, mas não foram coletados:</p>
            <ListGroup>
              {missingItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} variant="danger">
                  <div className="fw-bold">Plaqueta: {item.Inventário || 'N/A'} (Subnº: {item['Subnº']})</div>
                  <div>Descrição: {item.Descrição || 'Sem descrição'}</div>
                  <div>Centro de Custo Esperado: {item.CentroCusto || 'N/A'}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {wrongCcItems.length > 0 && (
          <div>
            <h5>⚠️ Itens em Outro Centro de Custo ({wrongCcItems.length})</h5>
            <p className="text-muted">Estes itens foram coletados, mas pertencem a um Centro de Custo diferente de {inventoryCc}:</p>
            <ListGroup>
              {wrongCcItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} variant="warning">
                  <div className="fw-bold">Plaqueta: {item.Inventário || 'N/A'} (Subnº: {item['Subnº']})</div>
                  <div>Descrição: {item.Descrição || 'Sem descrição'}</div>
                  <div>Centro de Custo Coletado: {item.CentroCusto || 'N/A'}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Fechar Relatório</Button>
        
        {/* === BOTÕES NOVOS === */}
        <Button 
          variant="success" 
          onClick={() => handleGenerateReport('csv')} 
          disabled={isGenerating || (missingItems.length === 0 && wrongCcItems.length === 0)}
        >
          {isGenerating === 'csv' ? <Spinner as="span" animation="border" size="sm" /> : 'Gerar CSV'}
        </Button>
        <Button 
          variant="danger" 
          onClick={() => handleGenerateReport('pdf')} 
          disabled={isGenerating || (missingItems.length === 0 && wrongCcItems.length === 0)}
        >
          {isGenerating === 'pdf' ? <Spinner as="span" animation="border" size="sm" /> : 'Gerar PDF'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DivergenceReport;