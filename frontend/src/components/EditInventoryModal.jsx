import React, { useState } from 'react';
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const EditInventoryModal = ({ show, onClose, item, onUpdateSuccess }) => {
  const [newInventoryCode, setNewInventoryCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    if (!newInventoryCode || newInventoryCode.length < 6) {
      setError('O novo código de inventário deve ter 6 dígitos.');
      return;
    }
    setIsUpdating(true);
    setError('');

    try {
      await axios.put(`${API_URL}/imobilizado/update-inventory`, {
        itemId: item.id,
        newInventoryCode: newInventoryCode,
      });
      
      onUpdateSuccess();
      
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleUpdate();
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Item:</strong> {item.Descrição}</p>
        <p><strong>Inventário Atual:</strong> {item.Inventário || 'Não definido'}</p>
        <hr />
        <Form.Group>
          <Form.Label className="fw-bold">Novo Código de Inventário</Form.Label>
          <Form.Control
            type="text"
            value={newInventoryCode}
            onChange={(e) => setNewInventoryCode(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={handleKeyDown}
            placeholder="Digite o novo código de 6 dígitos"
            maxLength={6}
            autoFocus
          />
        </Form.Group>
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleUpdate} disabled={isUpdating}>
          {isUpdating ? <Spinner as="span" animation="border" size="sm" /> : 'Salvar Alteração'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditInventoryModal;