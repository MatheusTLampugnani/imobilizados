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
      setError('Por favor, insira uma descrição para o item.');
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
          O item escaneado não foi encontrado. Complete o cadastro abaixo.
        </Alert>
        
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Código de Inventário (Plaqueta)</Form.Label>
          <Form.Control
            type="text"
            value={inventoryCode}
            onChange={(e) => setInventoryCode(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Descrição do Ativo</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Cadeira giratória preta..."
            autoFocus
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Local</Form.Label>
          <Form.Control
            type="text"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Ex: Sala 01, Recepção..."
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Número de Série (Opcional)</Form.Label>
          <Form.Control
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="S/N do equipamento"
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          />
        </Form.Group>

        {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleConfirm}>
          Salvar e Adicionar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddNotFoundItemModal;