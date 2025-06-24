import React, { useState } from 'react';
import { Card, Button, Accordion, Table, CloseButton } from 'react-bootstrap';
import { FaFileCsv, FaTrash, FaPlus } from 'react-icons/fa';
import BatchScannerModal from './BatchScannerModal';

const Inventory = ({ inventario, setInventario, onClose, onAddItem, isLoading }) => {
  const [isScannerOpen, setScannerOpen] = useState(false);

  const handleRemoveItem = (codigo) => {
    setInventario(inventario.filter(item => item.codigo !== codigo));
  };

  const handleScan = async (code) => {
    await onAddItem(code);
  };

  const handleClearInventory = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os itens do inventário?')) {
      setInventario([]);
    }
  };

  const handleExportCSV = () => {
    if (inventario.length === 0) {
      alert('O inventário está vazio.');
      return;
    }
    const headers = [
        'codigo_imobilizado', 'sub_numero', 'data_incorporacao', 'descricao', 
        'codigo_inventario', 'numero_serie', 'centro_custo'
    ];
    const csvRows = [];

    inventario.forEach(ativo => {
        ativo.itens.forEach(item => {
            const row = {
                codigo_imobilizado: ativo.codigo,
                sub_numero: item.Subnumero,
                data_incorporacao: item.Data,
                descricao: item.Descrição,
                codigo_inventario: item.Inventário,
                numero_serie: item.Série,
                centro_custo: item.CentroCusto,
            };
            csvRows.push(headers.map(fieldName => `"${row[fieldName] || ''}"`).join(';'));
        });
    });

    const csvString = [headers.join(';'), ...csvRows].join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `inventario_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Card className="mt-4">
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
          Inventário Ativo
          <CloseButton onClick={onClose} />
        </Card.Header>
        <Card.Body>
          <div className="mb-3 d-flex flex-wrap gap-2">
            <Button variant="success" onClick={() => setScannerOpen(true)}>
              <FaPlus className="me-2" /> Adicionar por Scanner
            </Button>
            <Button variant="info" onClick={handleExportCSV} disabled={inventario.length === 0}>
              <FaFileCsv className="me-2" /> Exportar para CSV
            </Button>
            <Button variant="warning" onClick={handleClearInventory} disabled={inventario.length === 0}>
              <FaTrash className="me-2" /> Limpar Inventário
            </Button>
          </div>
          <hr />
          {inventario.length === 0 ? (
            <p className="text-center text-muted">O inventário está vazio.</p>
          ) : (
            inventario.map((ativo) => (
              <Card key={ativo.codigo} className="mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                  <strong>CÓDIGO DO IMOBILIZADO: {ativo.codigo}</strong>
                  <Button variant="outline-danger" size="sm" onClick={() => handleRemoveItem(ativo.codigo)}>
                    Remover
                  </Button>
                </Card.Header>
                <Accordion defaultActiveKey="0" alwaysOpen>
                  {ativo.itens.map((item, subItemIndex) => (
                    <Accordion.Item eventKey={subItemIndex.toString()} key={subItemIndex}>
                      <Accordion.Header>
                        Item {subItemIndex + 1}: {item.Descrição || 'Sem descrição'}
                      </Accordion.Header>
                      <Accordion.Body>
                        <Table striped bordered hover responsive size="sm">
                          <tbody>
                            <tr><td style={{ width: '30%' }}><strong>DESCRIÇÃO</strong></td><td>{item.Descrição || 'N/A'}</td></tr>
                            <tr><td><strong>DATA DE INCORPORAÇÃO</strong></td><td>{item.Data}</td></tr>
                            <tr><td><strong>Nº DO INVENTÁRIO</strong></td><td>{item.Inventário || 'Sem número de inventário'}</td></tr>
                            <tr><td><strong>Nº DE SÉRIE</strong></td><td>{item.Série || 'Sem número de série'}</td></tr>
                            <tr><td><strong>CENTRO DE CUSTO</strong></td><td>{item.CentroCusto || 'Sem centro de custo'}</td></tr>
                            <tr><td><strong>SUBNÚMERO</strong></td><td>{item.Subnumero}</td></tr>
                          </tbody>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Card>
            ))
          )}
        </Card.Body>
        <Card.Footer className="text-muted">
          Total de imobilizados: {inventario.length}
        </Card.Footer>
      </Card>
      {isScannerOpen && (
        <BatchScannerModal
          show={isScannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={handleScan}
          isAddingItem={isLoading}
        />
      )}
    </>
  );
};

export default Inventory;