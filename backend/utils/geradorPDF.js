import React, { useEffect, useState } from 'react';
import { Modal, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Importe a imagem do logo diretamente. O React (com Webpack/Vite) irá processá-la.
import logoVideplast from '../assets/videplast-brand.png'; // <-- AJUSTE O CAMINHO SE NECESSÁRIO

// 1. Objeto de cores já está correto e será usado tanto na UI quanto no PDF.
const statusColors = {
  ok: '#12a351',
  faltante: '#ea899a',
  ccErrado: '#f2cb15',
  naoCadastrado: '#f1ad44',
};

const DivergenceReport = ({ show, onClose, onFinishAndReset, collectedItems, expectedItems, inventoryCc }) => {
  const [okItems, setOkItems] = useState([]);
  const [missingItems, setMissingItems] = useState([]);
  const [wrongCcItems, setWrongCcItems] = useState([]);
  const [notFoundItems, setNotFoundItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(null);

  // A lógica do useEffect para separar os itens está correta.
  useEffect(() => {
    if (show) {
      const formatCode = (item) => String(item.Inventário || item.Série || item.codigo_imobilizado || '').trim().replace(/\.0$/, '').replace(/^0+/, '');
      const collectedIds = new Set(collectedItems.map(item => formatCode(item)));

      const missing = expectedItems.filter(expectedItem => !collectedIds.has(formatCode(expectedItem)));
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

      const wrongCcIds = new Set(wrongCc.map(item => item.id));
      const notFound = collectedItems.filter(item => item.notFound);
      setNotFoundItems(notFound);

      const ok = collectedItems.filter(item => !wrongCcIds.has(item.id) && !item.notFound);
      setOkItems(ok);
    }
  }, [show, collectedItems, expectedItems, inventoryCc]);

  const handleGenerateReport = async (format) => {
    setIsGenerating(format);
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const tableColumns = ["Status", "Imobilizado", "Inventario", "Subnº", "Descrição", "Centro de Custo"];
      const tableRows = [];

      const createRow = (status, item) => [
        status,
        item.codigo_imobilizado || 'N/A',
        item.Inventário || 'N/A',
        item['Subnº'] || 'N/A', // Corrigido para 'Subnº' para corresponder à UI
        item.Descrição || 'Sem descrição',
        item.CentroCusto || 'N/A'
      ];

      okItems.forEach(item => tableRows.push(createRow("Ok", item)));
      missingItems.forEach(item => tableRows.push(createRow("Faltante", item)));
      wrongCcItems.forEach(item => tableRows.push(createRow("CC Errado", item)));
      notFoundItems.forEach(item => tableRows.push(createRow("Não Cadastrado", item)));
      
      if (format === 'pdf') {
        // 2. Inicialize o PDF aqui, fora de qualquer lógica condicional desnecessária.
        const doc = new jsPDF();
        
        // Adiciona o logo
        // O logo importado já é uma string base64 ou uma URL gerenciada pelo bundler.
        const imgWidth = 50;
        const imgHeight = (imgWidth * 128) / 512; // Mantém a proporção da imagem
        const centerX = (doc.internal.pageSize.getWidth() - imgWidth) / 2;
        doc.addImage(logoVideplast, 'PNG', centerX, 10, imgWidth, imgHeight);

        // Adiciona o título
        doc.setFontSize(18);
        doc.text(`Relatório de Divergências - CC: ${inventoryCc}`, 14, 45);
        
        // 3. A sua lógica para colorir as células já está correta!
        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: 55, // Ajusta a posição inicial da tabela para depois do logo e título
          willDrawCell: (data) => {
            // Não precisa verificar a coluna, aplica a cor na linha inteira
            if (data.section === 'body') {
              const status = data.row.raw[0]; // Pega o status da primeira coluna
              let textColor = 'black'; // Cor padrão do texto

              if (status === 'Ok') {
                data.cell.styles.fillColor = statusColors.ok;
                textColor = 'white'; // Texto branco para fundo verde escuro
              } else if (status === 'Faltante') {
                data.cell.styles.fillColor = statusColors.faltante;
              } else if (status === 'CC Errado') {
                data.cell.styles.fillColor = statusColors.ccErrado;
              } else if (status === 'Não Cadastrado') {
                data.cell.styles.fillColor = statusColors.naoCadastrado;
              }
              data.cell.styles.textColor = textColor;
            }
          },
          headStyles: { fillColor: [41, 46, 51], textColor: [255, 255, 255] }
        });

        doc.save(`Relatorio_Divergencias_CC_${inventoryCc}.pdf`);
      }

      if (format === 'csv') {
        // Lógica do CSV (não precisa de alteração)
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
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Ocorreu um erro ao gerar o relatório. Verifique o console para mais detalhes.");
    } finally {
      setIsGenerating(null);
    }
  };

  // O JSX para renderizar o modal já está correto e usando as cores.
  const renderItemDetails = (item) => (
    <>
      <div className="fw-bold">Plaqueta: {item.Inventário || 'N/A'} (Subnº: {item['Subnº'] || 'N/A'})</div>
      <div>Imobilizado: {item.codigo_imobilizado || 'N/A'}</div>
      <div>Descrição: {item.Descrição || 'Sem descrição'}</div>
    </>
  );

  return (
    <Modal show={show} onHide={onClose} centered size="xl" backdrop="static">
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>Relatório de Divergências do Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* ... seu JSX para exibir as listas ... (sem alterações) */}
        {missingItems.length === 0 && wrongCcItems.length === 0 && notFoundItems.length === 0 && (
          <Alert variant="success" className="text-center">Nenhuma divergência encontrada!</Alert>
        )}

        {okItems.length > 0 && (
          <div className="mb-4">
            <h5>Itens Corretos ({okItems.length})</h5>
            <ListGroup>
              {okItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} style={{ backgroundColor: statusColors.ok, color: 'white' }}>
                  {renderItemDetails(item)}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {missingItems.length > 0 && (
          <div className="mb-4">
            <h5>Itens Faltantes ({missingItems.length})</h5>
            <ListGroup>
              {missingItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} style={{ backgroundColor: statusColors.faltante, color: 'black' }}>
                  {renderItemDetails(item)}
                  <div>Centro de Custo Esperado: {item.CentroCusto || 'N/A'}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {wrongCcItems.length > 0 && (
          <div className="mb-4">
            <h5>Itens em Outro Centro de Custo ({wrongCcItems.length})</h5>
            <ListGroup>
              {wrongCcItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} style={{ backgroundColor: statusColors.ccErrado, color: 'black' }}>
                  {renderItemDetails(item)}
                  <div>Centro de Custo Coletado: {item.CentroCusto || 'N/A'}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {notFoundItems.length > 0 && (
          <div className="mb-4">
            <h5>Itens Não Cadastrados ({notFoundItems.length})</h5>
            <ListGroup>
              {notFoundItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} style={{ backgroundColor: statusColors.naoCadastrado, color: 'black' }}>
                  {renderItemDetails(item)}
                  <div>Centro de Custo Coletado: {item.CentroCusto || 'N/A'}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onFinishAndReset}>Voltar ao Início</Button>
        <Button variant="outline-secondary" onClick={onClose}>Retornar ao inventario</Button>
        <Button variant="success" onClick={() => handleGenerateReport('csv')} disabled={isGenerating}>
          {isGenerating === 'csv' ? <Spinner as="span" animation="border" size="sm" /> : 'Gerar CSV'}
        </Button>
        <Button variant="danger" onClick={() => handleGenerateReport('pdf')} disabled={isGenerating}>
          {isGenerating === 'pdf' ? <Spinner as="span" animation="border" size="sm" /> : 'Gerar PDF'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

module.exports = {
    handlePdfReportRequest
};
