import React, { useState } from 'react';
import { Modal, Button, ListGroup, Badge, Alert } from 'react-bootstrap';
import { BoxArrowUpRight, QrCodeScan, Trash } from 'react-bootstrap-icons';
import BatchScannerModal from './BatchScannerModal';

const Inventory = ({ inventario, setInventario, onClose, onAddItem, inventarioCentroCusto, expectedItems, onFinishInventory }) => {
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
    // A exportação agora itera sobre a lista de itens individuais
    let csvContent = "data:text/csv;charset=utf-8,Inventário;Subnº;Descrição;Data;Série;Centro de Custo\n";
    
    inventario.forEach(item => {
        const row = [
          item.Inventário,
          item["Subnº"],
          `"${item.Descrição || ''}"`,
          item.Data,
          item.Série,
          item.CentroCusto
        ].join(";");
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventario.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Modal show={true} onHide={onClose} centered size="xl" backdrop="static">
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>📋 Inventário de Ativos</Modal.Title>
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
              inventario.map((item) => (
                 // CORREÇÃO: Usa o 'id' único do item como chave
                 <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                   <div className="ms-2 me-auto">
                     <div className="fw-bold">Plaqueta: {item.Inventário || 'N/A'} (Subnº: {item['Subnº']})</div>
                     {item.Descrição || 'Item sem descrição'}
                   </div>
                   <Badge bg="danger" pill>ID: {item.id}</Badge>
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
            <Button variant="danger" onClick={() => setIsScanning(true)}>
                <QrCodeScan /> Escanear Itens em Lote
            </Button>
            <Button variant="primary" onClick={onFinishInventory} disabled={inventario.length === 0}>
              Finalizar Inventário
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
