import React, { useEffect, useState } from 'react';
import { Modal, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoVideplast from '../assets/videplast-brand.png';

const statusColors = {
  ok: '#1eff00ff',
  faltante: '#ff0015ff',
  ccErrado: '#fbff00ff',
  naoCadastrado: '#ffc400ff',
};

const DivergenceReport = ({ show, onClose, onFinishAndReset, collectedItems, expectedItems, inventoryCc }) => {
  const [okItems, setOkItems] = useState([]);
  const [missingItems, setMissingItems] = useState([]);
  const [wrongCcItems, setWrongCcItems] = useState([]);
  const [notFoundItems, setNotFoundItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(null);

  useEffect(() => {
    if (show) {
      const collectedMap = new Map();
      collectedItems.forEach(item => {
        // Usamos o código de inventário como chave única
        const key = String(item.Inventário || item.id).trim();
        if (key) collectedMap.set(key, item);
      });

      const expectedMap = new Map();
      expectedItems.forEach(item => {
        const key = String(item.Inventário || item.id).trim();
        if (key) expectedMap.set(key, item);
      });

      const newOk = [];
      const newMissing = [];
      const newWrongCc = [];
      const newNotFound = collectedItems.filter(item => item.notFound);
      const foundAndCollected = collectedItems.filter(item => !item.notFound);
      
      // Itera sobre os itens COLETADOS E CADASTRADOS
      foundAndCollected.forEach(collected => {
        const collectedKey = String(collected.Inventário).trim();
        const expectedItem = expectedMap.get(collectedKey);

        if (expectedItem) {
          // O item foi coletado e era esperado. Agora, checa o Centro de Custo.
          if (String(collected.CentroCusto).trim() === String(inventoryCc).trim()) {
            newOk.push(collected);
          } else {
            // Foi coletado, era esperado, mas o CC está errado no cadastro.
            newWrongCc.push(collected);
          }
        } else {
            // Foi coletado, está no cadastro, mas não era esperado para este CC.
            newWrongCc.push(collected);
        }
      });
      
      // Itera sobre os itens ESPERADOS para encontrar os faltantes
      expectedItems.forEach(expected => {
        const expectedKey = String(expected.Inventário).trim();
        if (!collectedMap.has(expectedKey)) {
          newMissing.push(expected);
        }
      });
      
      setOkItems(newOk);
      setMissingItems(newMissing);
      setWrongCcItems(newWrongCc);
      setNotFoundItems(newNotFound);
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
        item.codigo_imobilizado || 'Sem código de imobilizado',
        item.Inventário || 'Sem código de inventário',
        item.Subnº,
        item.Descrição || 'Sem descrição',
        item.CentroCusto || 'Sem centro de custo alocado'
      ];

      okItems.forEach(item => tableRows.push(createRow("Ok", item)));
      missingItems.forEach(item => tableRows.push(createRow("Faltante", item)));
      wrongCcItems.forEach(item => tableRows.push(createRow("CC Errado", item)));
      notFoundItems.forEach(item => tableRows.push(createRow("Não Cadastrado", item)));
      
      if (format === 'pdf') {
        const doc = new jsPDF();
        
        const imgWidth = 50;
        const imgHeight = 12; 
        const centerX = (doc.internal.pageSize.getWidth() - imgWidth) / 2;
        doc.addImage(logoVideplast, 'PNG', centerX, 10, imgWidth, imgHeight);

        doc.setFontSize(18);
        doc.text(`Relatório de Divergências - CC: ${inventoryCc}`, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
        
        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: 50,
          willDrawCell: (data) => {
            if (data.section === 'body') {
              const status = data.row.raw[0];
              const colorMap = {
                'Ok': statusColors.ok,
                'Faltante': statusColors.faltante,
                'CC Errado': statusColors.ccErrado,
                'Não Cadastrado': statusColors.naoCadastrado,
              };
              if (colorMap[status]) {
                data.cell.styles.fillColor = colorMap[status];
              }
            }
          },
          headStyles: { fillColor: [41, 46, 51], textColor: [255, 255, 255] }
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
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Ocorreu um erro ao gerar o relatório. Verifique o console para mais detalhes.");
    } finally {
      setIsGenerating(null);
    }
  };


  const renderItemDetails = (item, type) => (
    <>
      <div className="fw-bold">
        {type === 'notFound' ? 'Código Lido: ' : 'Plaqueta: '}
        {item.Inventário || 'Sem código de inventário'}
        {type !== 'notFound' && ` (Subnº: ${item['Subnº'] || 'Sem sub-numero'})`}
      </div>
      {type !== 'notFound' && <div>Imobilizado: {item.codigo_imobilizado || 'Sem código de imobilizado'}</div>}
      <div>Descrição: {item.Descrição || 'Sem descrição'}</div>
      {type === 'missing' && <div>Centro de Custo Esperado: {item.CentroCusto || 'Sem centro de custo'}</div>}
      {(type === 'wrongCc' || type === 'notFound') && <div>Centro de Custo: {item.CentroCusto || 'Sem centro de custo'}</div>}
    </>
  );

  return (
    <Modal show={show} onHide={onClose} centered size="xl" backdrop="static">
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>Relatório de Divergências do Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {okItems.length === 0 && missingItems.length === 0 && wrongCcItems.length === 0 && notFoundItems.length === 0 && (
          <Alert variant="success" className="text-center">Nenhuma divergência encontrada!</Alert>
        )}

        {okItems.length > 0 && (
          <div className="mb-4">
            <h5>✅ Itens Corretos ({okItems.length})</h5>
            <ListGroup>
              {okItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} variant="success">
                  {renderItemDetails(item, 'ok')}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {missingItems.length > 0 && (
          <div className="mb-4">
            <h5>❌ Itens Faltantes ({missingItems.length})</h5>
            <ListGroup>
              {missingItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} variant="danger">
                  {renderItemDetails(item, 'missing')}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {wrongCcItems.length > 0 && (
          <div className="mb-4">
            <h5>⚠️ Itens em Outro Centro de Custo ({wrongCcItems.length})</h5>
            <ListGroup>
              {wrongCcItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} variant="warning">
                  {renderItemDetails(item, 'wrongCc')}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {notFoundItems.length > 0 && (
          <div className="mb-4">
            <h5>➕ Itens Não Cadastrados ({notFoundItems.length})</h5>
            <ListGroup>
              {notFoundItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} variant="info">
                   {renderItemDetails(item, 'notFound')}
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

export default DivergenceReport;