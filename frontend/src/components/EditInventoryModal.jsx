import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../apiConfig';

const EditInventoryModal = ({ show, onClose, item, onUpdateSuccess }) => {
  const [newInventoryCode, setNewInventoryCode] = useState(item?.Inventário || item?.codigo_inventario || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase
        .from('imobilizados')
        .update({ codigo_inventario: newInventoryCode })
        .eq('id', item.id);

      if (error) throw error;

      onUpdateSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao atualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title>Editar Plaqueta</Modal.Title></Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group>
          <Form.Label>Novo Código</Form.Label>
          <Form.Control 
            value={newInventoryCode} 
            onChange={e => setNewInventoryCode(e.target.value)} 
            autoFocus
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleUpdate} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border"/> : 'Salvar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditInventoryModal;