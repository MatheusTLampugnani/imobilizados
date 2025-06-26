import React, { useState } from 'react';
import { Modal, Button, ListGroup, Badge, Alert } from 'react-bootstrap';
import { BoxArrowUpRight, QrCodeScan, Trash } from 'react-bootstrap-icons';
import BatchScannerModal from './BatchScannerModal';

const Inventory = ({ inventario, setInventario, onClose, onAddItem }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'info' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddItem = async (code) => {
    if (!code || isAdding) return;

    setIsAdding(true);
    setFeedback({ message: '', type: 'info' });

    const success = await onAddItem(code);

    if (success) {
      setFeedback({ message: `Item ${code} adicionado com sucesso!`, type: 'success' });
    } else {
      setFeedback({ message: `Item ${code} não encontrado.`, type: 'danger' });
    }

    setIsAdding(false);
    setTimeout(() => setFeedback({ message: '', type: 'info' }), 2000);
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Codigo do Imobilizado;Subn;Descricao;Data de Incorporacao;N do Inventario;N de Serie;Centro de Custo\n";
    
    inventario.forEach(imobilizado => {
      imobilizado.itens.forEach(item => {
        const row = [
          imobilizado.codigo_imobilizado,
          item["Subnº"],
          `"${item.Descrição || ''}"`,
          item.Data,
          item.Inventário,
          item.Série,
          item.CentroCusto
        ].join(";");
        csvContent += row + "\r\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventario_imobilizados.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Modal show={true} onHide={onClose} centered size="xl" backdrop="static">
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>Inventário de Ativos</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            {feedback.message && (
              <Alert variant={feedback.type} className="py-2">
                {feedback.message}
              </Alert>
            )}
          </div>
          <ListGroup variant="flush">
            {inventario.length > 0 ? (
              inventario.map((imobilizado, index) => (
                 <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                   <div className="ms-2 me-auto">
                     <div className="fw-bold">Cód: {imobilizado.codigo_imobilizado}</div>
                     {imobilizado.itens[0]?.Descrição || 'Item sem descrição'}
                   </div>
                   <Badge bg="danger" pill>{imobilizado.itens.length}</Badge>
                 </ListGroup.Item>
              ))
            ) : (
              <p className="text-center text-muted p-4">A lista de inventário está vazia. Inicie o escaneamento.</p>
            )}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setInventario([])} disabled={inventario.length === 0}>
                <Trash /> Limpar Lista
            </Button>
            <Button variant="success" onClick={exportToCSV} disabled={inventario.length === 0}>
                <BoxArrowUpRight /> Exportar CSV
            </Button>
            <Button variant="danger" onClick={() => setIsScanning(true)}>
                <QrCodeScan /> Escanear Itens
            </Button>
            <Button variant="secondary" onClick={onClose}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {isScanning && (
        <BatchScannerModal
          show={isScanning}
          onScan={handleAddItem}
          onClose={() => setIsScanning(false)}
          isAddingItem={isAdding}
        />
      )}
    </>
  );
};

export default Inventory;