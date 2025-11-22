import React, { useState } from 'react';
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const EditInventoryModal = ({ show, onClose, item, onUpdateSuccess }) => {
  const [newInventoryCode, setNewInventoryCode] = useState('');
  const [cracha, setCracha] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    if (!newInventoryCode) {
      setError('Por favor, digite o novo código de inventário.');
      return;
    }

    if (!cracha.trim()) {
      setError('É obrigatório informar o número do crachá para realizar a alteração.');
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      await axios.put(`${API_URL}/imobilizado/update-inventory`, {
        itemId: item.id,
        newInventoryCode: newInventoryCode,
        user: cracha
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
        
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Novo Código de Inventário</Form.Label>
          <Form.Control
            type="text"
            value={newInventoryCode}
            onChange={(e) => setNewInventoryCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Digite o novo código (somente números)"
            autoFocus
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Crachá do Responsável</Form.Label>
          <Form.Control
            type="text"
            value={cracha}
            onChange={(e) => setCracha(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite ou bipe o crachá"
          />
        </Form.Group>

        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleUpdate} disabled={isUpdating}>
          {isUpdating ? <Spinner as="span" animation="border" size="sm" /> : 'Confirmar e Salvar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditInventoryModal;