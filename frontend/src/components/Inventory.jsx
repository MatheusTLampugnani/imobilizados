import React, { useState } from 'react';
// 1. Adicione Accordion e Table aos imports do react-bootstrap
import { Card, Button, Accordion, Table, CloseButton } from 'react-bootstrap';
import { FaFileCsv, FaTrash, FaPlus } from 'react-icons/fa';

import BatchScannerModal from './BatchScannerModal';

const Inventory = ({ inventario, setInventario, onClose, onAddItem, isLoading }) => {
  const [isScannerOpen, setScannerOpen] = useState(false);

  // As funções de controle do inventário permanecem as mesmas
  const handleRemoveItem = (codigo) => {
    setInventario(inventario.filter(item => item.codigo !== codigo));
  };

  const handleScan = async (code) => {
    await onAddItem(code);
  };

  const handleClearInventory = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os itens do inventário? Esta ação não pode ser desfeita.')) {
      setInventario([]);
    }
  };

  const handleExportCSV = () => {
    if (inventario.length === 0) {
      alert('O inventário está vazio. Adicione itens antes de exportar.');
      return;
    }
    const headers = ['codigo', 'descricao', 'centro_custo', 'localizacao', 'classe_ativo'];
    const csvRows = inventario.map(item =>
      headers.map(fieldName => `"${item[fieldName] || ''}"`).join(';')
    );
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

          {/* 2. Lógica de exibição atualizada */}
          {inventario.length === 0 ? (
            <p className="text-center text-muted">O inventário está vazio.</p>
          ) : (
            // Mapeia cada imobilizado do inventário para um Card de detalhes
            inventario.map((ativo, index) => (
              <Card key={`${ativo.codigo}-${index}`} className="mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                  <strong>Imobilizado: {ativo.codigo}</strong>
                  <Button variant="outline-danger" size="sm" onClick={() => handleRemoveItem(ativo.codigo)}>
                    Remover do Inventário
                  </Button>
                </Card.Header>
                <Accordion defaultActiveKey="0" alwaysOpen>
                  {/* Mapeia os sub-itens de cada imobilizado para um Acordeão */}
                  {ativo.itens.map((subItem, subItemIndex) => (
                    <Accordion.Item eventKey={subItemIndex.toString()} key={subItemIndex}>
                      <Accordion.Header>
                        Item {subItem.Número || subItemIndex + 1}: {subItem.Descrição || 'Sem descrição'}
                      </Accordion.Header>
                      <Accordion.Body>
                        {/* Tabela com os detalhes, igual à da tela de consulta */}
                        <Table striped bordered hover responsive size="sm">
                          <tbody>
                            <tr>
                              <td style={{ width: '30%' }}><strong>Descrição</strong></td>
                              <td>{subItem.Descrição || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td><strong>Data</strong></td>
                              <td>{subItem.Data || 'N/A'}</td>
                            </tr>
                            {subItem.Inventário && <tr><td><strong>Inventário</strong></td><td>{subItem.Inventário}</td></tr>}
                            {subItem.Série && <tr><td><strong>Série</strong></td><td>{subItem.Série}</td></tr>}
                            {subItem['Centro Custo'] && <tr><td><strong>Centro de Custo</strong></td><td>{subItem['Centro Custo']}</td></tr>}
                            {subItem['Subnº'] && <tr><td><strong>Subnúmero</strong></td><td>{subItem['Subnº']}</td></tr>}
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