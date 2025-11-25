import React, { useState } from 'react';
import { Modal, Button, ListGroup, Badge } from 'react-bootstrap';
import { QrCodeScan, Trash, TrashFill } from 'react-bootstrap-icons';
import BatchScannerModal from './BatchScannerModal';
import StatusModal from './StatusModal';

const Inventory = ({ inventario, setInventario, onClose, onAddItem, inventarioCentroCusto, onFinishInventory, onRemoveItem }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState({ show: false, type: 'success', message: '' });

  const handleAddItem = async (code) => {
    if (!code || isAdding) return;

    setIsAdding(true);

    const success = await onAddItem(code);

    if (success) {
      setStatusFeedback({
        show: true,
        type: 'success',
        message: `Item ${code} contabilizado com sucesso!`
      });
    } else {
      setStatusFeedback({
        show: true,
        type: 'error',
        message: `O item ${code} não foi encontrado ou houve um problema.`
      });
    }

    setIsAdding(false);
  };

  const handleCloseStatus = () => {
    setStatusFeedback({ ...statusFeedback, show: false });
  };

  return (
    <>
      <Modal show={true} onHide={onClose} centered size="xl" backdrop="static">
        <Modal.Header closeButton className="bg-dark text-white"> 
          <Modal.Title>Inventário de Ativos - Centro de Custo {inventarioCentroCusto}</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          <ListGroup variant="flush">
            {inventario.length > 0 ? (
              inventario.map((item) => (
                <ListGroup.Item 
                  key={item.id} 
                  className="d-flex justify-content-between align-items-center"
                  variant={item.notFound ? 'warning' : ''}
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">
                      {item.notFound ? 'Código Lido: ' : 'Plaqueta: '} 
                      {item.Inventário || 'Sem número de inventário'} 
                      {!item.notFound && ` (Subnº: ${item['Subnº']})`}
                    </div>
                    {item.Descrição || 'Item sem descrição'}
                  </div>
                  
                  <Badge bg={item.notFound ? "secondary" : "danger"} pill className="me-3">
                    {item.notFound ? (item.pendingSave ? 'NOVO (PENDENTE)' : 'NÃO CADASTRADO') : `ID: ${item.id}`}
                  </Badge>

                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => onRemoveItem(item.id)}
                    title="Remover este item"
                  >
                    <TrashFill />
                  </Button>

                </ListGroup.Item>
              ))
            ) : (
              <p className="text-center text-muted p-4">A lista de inventário está vazia. Inicie o escaneamento.</p>
            )}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setInventario([])} disabled={inventario.length === 0}>
            <Trash /> Limpar Tudo
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

      <StatusModal 
        show={statusFeedback.show}
        type={statusFeedback.type}
        message={statusFeedback.message}
        onClose={handleCloseStatus}
      />

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