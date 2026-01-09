import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../apiConfig';

const EditItemDetailsModal = ({ show, onClose, item, onUpdateSuccess }) => {
  const [numeroSerie, setNumeroSerie] = useState('');
  const [centroCusto, setCentroCusto] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
        setNumeroSerie(item.numero_serie || item.Série || '');
        setCentroCusto(item.centro_custo || item.CentroCusto || '');
    }
  }, [item, show]);

  const handleUpdate = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('imobilizados')
        .update({ 
            numero_serie: numeroSerie,
            centro_custo: centroCusto
        })
        .eq('id', item.id);

      if (error) throw error;

      onUpdateSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Erro ao atualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Detalhes</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form.Group className="mb-3">
          <Form.Label>Número de Série</Form.Label>
          <Form.Control 
            type="text" 
            value={numeroSerie} 
            onChange={(e) => setNumeroSerie(e.target.value)} 
            placeholder="Digite o nº de série..."
            autoFocus
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Centro de Custo</Form.Label>
          <Form.Control 
            type="text" 
            value={centroCusto} 
            onChange={(e) => setCentroCusto(e.target.value)} 
            placeholder="Ex: 1005ADMI03"
          />
          <Form.Text className="text-muted">
            Atenção: Digite o código exato do Centro de Custo.
          </Form.Text>
        </Form.Group>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleUpdate} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : 'Salvar Alterações'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditItemDetailsModal;