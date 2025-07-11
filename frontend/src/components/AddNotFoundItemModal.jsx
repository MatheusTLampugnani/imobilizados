import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const AddNotFoundItemModal = ({ show, onClose, onConfirm, itemCode }) => {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!description.trim()) {
      setError('Por favor, insira uma descrição para o item.');
      return;
    }
    onConfirm(description);
    handleClose();
  };

  const handleClose = () => {
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Adicionar Item Não Encontrado</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>O item com o código <strong>{itemCode}</strong> não foi encontrado no banco de dados.</p>
        <p>Deseja adicioná-lo ao inventário atual? Se sim, por favor, forneça uma descrição.</p>
        <Form.Group>
          <Form.Label>Descrição do Ativo</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Cadeira de escritório, preta, com rodinhas"
            autoFocus
          />
        </Form.Group>
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleConfirm}>
          Confirmar e Adicionar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddNotFoundItemModal;