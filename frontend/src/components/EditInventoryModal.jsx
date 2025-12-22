import React, { useState } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import imgSuccess from '../assets/verificado.png';
import imgError from '../assets/cruz.png';

const EditInventoryModal = ({ show, onClose, item, onUpdateSuccess }) => {
  const [newInventoryCode, setNewInventoryCode] = useState('');
  const [cracha, setCracha] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [viewState, setViewState] = useState('form'); 

  const handleUpdate = async () => {
    if (!newInventoryCode) {
      setError('Por favor, digite o novo código de inventário.');
      setViewState('error'); 
      return;
    }
    if (!cracha.trim()) {
      setError('É obrigatório informar o número do crachá.');
      setViewState('error');
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
      
      setViewState('success');
      
      setTimeout(() => {
        onUpdateSuccess();
        resetModal();
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar. Tente novamente.');
      setViewState('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const resetModal = () => {
    setViewState('form');
    setNewInventoryCode('');
    setCracha('');
    setError('');
  };

  const handleCloseInternal = () => {
      resetModal();
      onClose();
  };

  return (
    <Modal show={show} onHide={handleCloseInternal} centered>
      <Modal.Header closeButton={viewState === 'form'}>
        <Modal.Title>Editar Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        
        {viewState === 'success' && (
            <div className="text-center py-4">
                <img src={imgSuccess} alt="Sucesso" style={{ width: '80px', marginBottom: '15px' }} />
                <h4 className="text-success">Atualizado com Sucesso!</h4>
            </div>
        )}

        {viewState === 'error' && (
            <div className="text-center py-4">
                <img src={imgError} alt="Erro" style={{ width: '80px', marginBottom: '15px' }} />
                <h4 className="text-danger">Erro!</h4>
                <p className="text-muted">{error}</p>
                <Button variant="secondary" onClick={() => setViewState('form')}>
                    Tentar Novamente
                </Button>
            </div>
        )}

        {viewState === 'form' && (
            <>
                <p><strong>Item:</strong> {item.Descrição}</p>
                <p><strong>Inventário Atual:</strong> {item.Inventário || 'Não definido'}</p>
                <hr />
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Novo Código de Inventário</Form.Label>
                  <Form.Control
                    type="text"
                    value={newInventoryCode}
                    onChange={(e) => setNewInventoryCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Digite o novo código"
                    autoFocus
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Crachá do Responsável</Form.Label>
                  <Form.Control
                    type="text"
                    value={cracha}
                    onChange={(e) => setCracha(e.target.value)}
                    placeholder="Digite ou bipe o crachá"
                  />
                </Form.Group>
            </>
        )}
      </Modal.Body>
      
      {viewState === 'form' && (
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseInternal}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? <Spinner as="span" animation="border" size="sm" /> : 'Confirmar e Salvar'}
            </Button>
          </Modal.Footer>
      )}
    </Modal>
  );
};

export default EditInventoryModal;