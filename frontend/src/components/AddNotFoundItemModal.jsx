import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const AddNotFoundItemModal = ({ show, onClose, onConfirm, itemCode, defaultLocal }) => {
  const [description, setDescription] = useState('');
  const [inventoryCode, setInventoryCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [local, setLocal] = useState(''); 
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      if (itemCode) setInventoryCode(itemCode);
      if (defaultLocal) setLocal(defaultLocal);
    }
  }, [show, itemCode, defaultLocal]);

  const handleConfirm = () => {
    if (!description.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }
    if (!inventoryCode.trim()) {
      setError('O código de inventário é obrigatório.');
      return;
    }
    
    onConfirm(description, inventoryCode, serialNumber, local);
    handleClose();
  };

  const handleClose = () => {
    setDescription('');
    setSerialNumber('');
    setError('');
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Cadastrar Novo Item</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="warning">
          Item não encontrado! Preencha os dados para cadastro.
        </Alert>
        
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Código de Inventário</Form.Label>
          <Form.Control
            type="text"
            value={inventoryCode}
            onChange={(e) => setInventoryCode(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Descrição</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Mesa de escritório branca..."
            autoFocus
          />
        </Form.Group>

        <div className="row">
          <div className="col-6">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nº de Série</Form.Label>
              <Form.Control
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </Form.Group>
          </div>
          <div className="col-6">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Local</Form.Label>
              <Form.Control
                type="text"
                value={local}
                placeholder='Ex: Sala de Treinamento 01'
                onChange={(e) => setLocal(e.target.value)}
              />
            </Form.Group>
          </div>
        </div>

        {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
        <Button variant="success" onClick={handleConfirm}>Salvar Novo Item</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddNotFoundItemModal;