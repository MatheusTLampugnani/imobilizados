import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, InputGroup } from 'react-bootstrap';
import { FileEarmarkPdf, GeoAlt } from 'react-bootstrap-icons';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import imgSuccess from '../assets/verificado.png';
import imgError from '../assets/cruz.png';
import { generateWriteOffPDF } from '../utils/generateWriteOffPDF';
import { locationsData } from '../utils/locais';

const EditInventoryModal = ({ show, onClose, item, editType, onUpdateSuccess, currentUser }) => {
  const [newValue, setNewValue] = useState('');
  const [cracha, setCracha] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [viewState, setViewState] = useState('form'); 
  const [editSector, setEditSector] = useState('');
  const [editSubLocal, setEditSubLocal] = useState('');
  const [editSubLocalOptions, setEditSubLocalOptions] = useState([]);

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
          currentValue: item?.['Série'] || item?.Serie || item?.numero_serie, 
          endpoint: '/imobilizado/update-serial',
          payloadKey: 'newSerial'
        };
      case 'local':
        return {
            title: 'Editar Localização',
            label: 'Novo Local',
            currentLabel: 'Local Atual',
            currentValue: item?.Local,
            endpoint: '/imobilizado/update-local',
            payloadKey: 'newLocal'
        };
      default:
        return { title: 'Editar', label: 'Novo Valor', endpoint: '' };
    }
  };

  const config = getEditConfig();

  useEffect(() => {
    if (show) {
        setNewValue(config.currentValue || '');
        setCracha('');
        setViewState('form');
        setError('');

        if (editType === 'local') {
            let currentSector = '';
            let currentSub = '';
            const localAtual = item?.Local || '';

            if (localAtual.includes(' - ')) {
                const parts = localAtual.split(' - ');
                currentSector = parts[0];
                currentSub = parts.slice(1).join(' - ');
            } else {
                currentSector = Object.keys(locationsData).find(key => localAtual.includes(key)) || '';
            }
            
            setEditSector(currentSector);
            setEditSubLocal(currentSub);
            setEditSubLocalOptions(currentSector ? locationsData[currentSector] : []);
        }
    }
  }, [show, editType, item]); 

  const handleSectorChange = (e) => {
      const sector = e.target.value;
      setEditSector(sector);
      if (sector && locationsData[sector]) {
          setEditSubLocalOptions(locationsData[sector]);
          setEditSubLocal('');
          setNewValue(`${sector} - `);
      } else {
          setEditSubLocalOptions([]);
          setEditSubLocal('');
          setNewValue('');
      }
  };

  const handleSubLocalChange = (e) => {
      const sub = e.target.value;
      setEditSubLocal(sub);
      setNewValue(`${editSector} - ${sub}`);
  };

  const handleUpdate = async () => {
    if (editType === 'local') {
        if (!editSector || !editSubLocal) {
            setError('Selecione o Setor e o Ambiente.');
            setViewState('error');
            return;
        }
    } else if (!newValue) { 
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

  const handleBaixa = () => {
    const userForReport = currentUser || { cracha: cracha, nome: 'Usuário' };
    generateWriteOffPDF(item, userForReport);
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
                  {editType === 'local' ? (
                      <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Novo Local</Form.Label>
                          <InputGroup>
                              <InputGroup.Text className="bg-light"><GeoAlt /></InputGroup.Text>
                              <Form.Select value={editSector} onChange={handleSectorChange}>
                                  <option value="">Selecione o Setor...</option>
                                  {Object.keys(locationsData).map(sector => (
                                      <option key={sector} value={sector}>{sector}</option>
                                  ))}
                              </Form.Select>
                              <Form.Select value={editSubLocal} onChange={handleSubLocalChange} disabled={!editSector}>
                                  <option value="">Ambiente...</option>
                                  {editSubLocalOptions.map((sub, idx) => (
                                      <option key={idx} value={sub}>{sub}</option>
                                  ))}
                              </Form.Select>
                          </InputGroup>
                      </Form.Group>
                  ) : (
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
                  )}

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
          <Modal.Footer className="justify-content-between">
            <Button variant="outline-dark" onClick={handleBaixa} title="Gera termo de baixa em PDF">
               <FileEarmarkPdf className="me-2"/> Dar Baixa
            </Button>

            <div className="d-flex gap-2">
                <Button variant="secondary" onClick={handleCloseInternal}>
                Cancelar
                </Button>
                <Button variant="danger" onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? <Spinner as="span" animation="border" size="sm" /> : 'Confirmar e Salvar'}
                </Button>
            </div>
          </Modal.Footer>
      )}
    </Modal>
  );
};

export default EditInventoryModal;