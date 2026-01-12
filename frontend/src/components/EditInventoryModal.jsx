import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import imgSuccess from '../assets/verificado.png';
import imgError from '../assets/cruz.png';

const EditInventoryModal = ({ show, onClose, item, editType, onUpdateSuccess }) => {
  const [newValue, setNewValue] = useState('');
  const [cracha, setCracha] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [viewState, setViewState] = useState('form'); 

  const getEditConfig = () => {
    switch (editType) {
      case 'inventory':
        return {
          title: 'Editar Inventário',
          label: 'Novo Código de Inventário',
          currentLabel: 'Inventário Atual',
          currentValue: item?.Inventário,
          endpoint: '/imobilizado/update-inventory',
          payloadKey: 'newInventoryCode'
        };
      case 'cost_center':
        return {
          title: 'Editar Centro de Custo',
          label: 'Novo Centro de Custo',
          currentLabel: 'Centro de Custo Atual',
          currentValue: item?.CentroCusto,
          endpoint: '/imobilizado/update-cost-center',
          payloadKey: 'newCostCenter'
        };
      case 'serial':
        return {
          title: 'Editar Número de Série',
          label: 'Nova Série',
          currentLabel: 'Série Atual',
          currentValue: item?.['Série'] || item?.numero_serie, 
          endpoint: '/imobilizado/update-serial',
          payloadKey: 'newSerial'
        };
      default:
        return { title: 'Editar', label: 'Novo Valor', endpoint: '' };
    }
  };

  const config = getEditConfig();

  useEffect(() => {
    if (show) {
        setNewValue('');
        setCracha('');
        setViewState('form');
        setError('');
    }
  }, [show, editType]);

  const handleUpdate = async () => {
    if (!newValue && editType !== 'serial') { 
      setError(`Por favor, digite o ${config.label.toLowerCase()}.`);
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
      const payload = {
        itemId: item.id,
        user: cracha,
        [config.payloadKey]: newValue
      };

      await axios.put(`${API_URL}${config.endpoint}`, payload);
      
      setViewState('success');
      
      setTimeout(() => {
        onUpdateSuccess(item.id, editType, newValue);
        resetModal();
      }, 1500);
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao atualizar. Tente novamente.');
      setViewState('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const resetModal = () => {
    setViewState('form');
    setNewValue('');
    setCracha('');
    setError('');
  };

  const handleCloseInternal = () => {
      resetModal();
      onClose();
  };

  if (!item) return null;

  return (
    <Modal show={show} onHide={handleCloseInternal} centered>
      <Modal.Header closeButton={viewState === 'form'}>
        <Modal.Title>{config.title}</Modal.Title>
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
                <p><strong>{config.currentLabel}:</strong> {config.currentValue || 'Não definido'}</p>
                <hr />
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{config.label}</Form.Label>
                  <Form.Control
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={`Digite ${config.label.toLowerCase()}`}
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