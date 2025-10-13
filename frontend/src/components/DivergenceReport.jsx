import React, { useEffect, useState } from 'react';
import { Modal, Button, ListGroup, Alert, Spinner, Form } from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoVideplast from '../assets/videplast-brand.png';

const statusColors = {
  ok: '#00ff00ff',
  faltante: '#ff0000ff',
  ccErrado: '#ffc400ff',
  naoCadastrado: '#00d0ffff',
};

const DivergenceReport = ({ show, onClose, onFinishAndReset, collectedItems, expectedItems, inventoryCc }) => {
  const [okItems, setOkItems] = useState([]);
  const [missingItems, setMissingItems] = useState([]);
  const [wrongCcItems, setWrongCcItems] = useState([]);
  const [notFoundItems, setNotFoundItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(null);
  
  // Novo estado para os filtros
  const [filters, setFilters] = useState({
    ok: true,
    missing: true,
    wrongCc: true,
    notFound: true,
  });

  useEffect(() => {
    if (show) {
      const newNotFound = collectedItems.filter(item => item.notFound);
      const foundAndCollected = collectedItems.filter(item => !item.notFound);
      
      const newOk = [];
      const newWrongCc = [];
      foundAndCollected.forEach(item => {
        if (String(item.CentroCusto).trim() === String(inventoryCc).trim()) {
          newOk.push(item);
        } else {
          newWrongCc.push(item);
        }
      });

      const collectedInventarioMap = new Map();
      collectedItems.forEach(item => collectedInventarioMap.set(String(item.Inventário).trim(), item));
      
      const newMissing = expectedItems.filter(expected => {
        return !collectedInventarioMap.has(String(expected.Inventário).trim());
      });

      setOkItems(newOk);
      setMissingItems(newMissing);
      setWrongCcItems(newWrongCc);
      setNotFoundItems(newNotFound);
    }
  }, [show, collectedItems, expectedItems, inventoryCc]);

  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.checked,
    });
  };

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

      // Adiciona linhas apenas se o filtro estiver ativo
      if (filters.ok) okItems.forEach(item => tableRows.push(createRow("Ok", item)));
      if (filters.missing) missingItems.forEach(item => tableRows.push(createRow("Faltante", item)));
      if (filters.wrongCc) wrongCcItems.forEach(item => tableRows.push(createRow("CC Errado", item)));
      if (filters.notFound) notFoundItems.forEach(item => tableRows.push(createRow("Não Cadastrado", item)));
      
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

  // Função para renderizar a lista de itens, aplicando o filtro
  const renderItemList = (items, title, type, variant) => {
    if (items.length === 0 || !filters[type]) return null;

    return (
      <div className="mb-4">
        <h5>{title} ({items.length})</h5>
        <ListGroup>
          {items.map((item, index) => (
            <ListGroup.Item key={item.id || index} variant={variant}>
              {renderItemDetails(item, type)}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onClose} centered size="xl" backdrop="static">
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>Relatório de Divergências do Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3 p-3 border rounded">
          <h6 className="mb-2">Filtros de Visualização:</h6>
          <Form>
            <div className="d-flex flex-wrap gap-3">
              <Form.Check 
                type="checkbox"
                id="filter-ok"
                label={`Itens Corretos (${okItems.length})`}
                name="ok"
                checked={filters.ok}
                onChange={handleFilterChange}
              />
              <Form.Check 
                type="checkbox"
                id="filter-missing"
                label={`Itens Faltantes (${missingItems.length})`}
                name="missing"
                checked={filters.missing}
                onChange={handleFilterChange}
              />
              <Form.Check 
                type="checkbox"
                id="filter-wrongCc"
                label={`Itens em Outro CC (${wrongCcItems.length})`}
                name="wrongCc"
                checked={filters.wrongCc}
                onChange={handleFilterChange}
              />
              <Form.Check 
                type="checkbox"
                id="filter-notFound"
                label={`Itens Não Cadastrados (${notFoundItems.length})`}
                name="notFound"
                checked={filters.notFound}
                onChange={handleFilterChange}
              />
            </div>
          </Form>
        </div>

        {okItems.length === 0 && missingItems.length === 0 && wrongCcItems.length === 0 && notFoundItems.length === 0 && (
          <Alert variant="success" className="text-center">Nenhuma divergência encontrada!</Alert>
        )}

        {renderItemList(okItems, '✅ Itens Corretos', 'ok', 'success')}
        {renderItemList(missingItems, '❌ Itens Faltantes', 'missing', 'danger')}
        {renderItemList(wrongCcItems, '⚠️ Itens em Outro Centro de Custo', 'wrongCc', 'warning')}
        {renderItemList(notFoundItems, '➕ Itens Não Cadastrados', 'notFound', 'info')}

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