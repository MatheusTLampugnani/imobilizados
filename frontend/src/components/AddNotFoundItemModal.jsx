import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { BoxSeam, UpcScan, GeoAlt, ListTask, PersonBadge, ChatLeftText } from 'react-bootstrap-icons'; 
import axios from 'axios';
import { API_URL } from '../apiConfig';
import { locationsData, montarLocal } from '../utils/locais';

const AddNotFoundItemModal = ({ show, onClose, onConfirm, itemCode, defaultLocal, centroCusto, user }) => {
  const [description, setDescription] = useState('');
  const [inventoryCode, setInventoryCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [observacao, setObservacao] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedSubLocal, setSelectedSubLocal] = useState('');
  const [availableSubLocals, setAvailableSubLocals] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (show) {
      if (itemCode) setInventoryCode(itemCode);
      setSelectedSector('');
      setSelectedSubLocal('');
      setAvailableSubLocals([]);
      setObservacao('');
      setError('');
      setIsLoading(false);
    }
  }, [show, itemCode]);

  const handleSectorChange = (e) => {
    const sector = e.target.value;
    setSelectedSector(sector);
    if (sector && locationsData[sector]) {
      setAvailableSubLocals(locationsData[sector]);
      setSelectedSubLocal('');
    } else {
      setAvailableSubLocals([]);
      setSelectedSubLocal('');
    }
  };

  const handleConfirm = async () => {
    if (!description.trim()) return setError('A descrição é obrigatória.');
    if (!inventoryCode.trim()) return setError('O código de inventário é obrigatório.');
    if (!centroCusto) return setError('Centro de Custo não informado.');
    if (!selectedSector || !selectedSubLocal) return setError('Selecione o Local e o Sub-local.');

    setIsLoading(true);
    setError('');

    const finalLocalString = montarLocal(selectedSector, selectedSubLocal); // código curto (até 15 caracteres)

    try {
      const payload = {
        descricao: description,
        codigo_inventario: inventoryCode,
        centro_custo: centroCusto,
        user: user || 'Sistema',
        numero_serie: serialNumber,
        local: finalLocalString,
        observacao: observacao.trim() || null
      };

      const response = await axios.post(`${API_URL}/imobilizado`, payload);

      if (onConfirm) onConfirm(description, inventoryCode, serialNumber, finalLocalString, response.data);
      handleClose();

    } catch (err) {
      console.error("Erro no cadastro:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Ocorreu um erro ao salvar o item.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setSerialNumber('');
    setObservacao('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static" size="lg">
      <Modal.Header closeButton className="bg-danger text-white border-0 shadow-sm">
        <Modal.Title className="d-flex align-items-center gap-2">
          <BoxSeam size={24} /> Cadastrar Novo Item
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="bg-light">
        <Alert variant="info" className="d-flex align-items-center gap-2 border-0 shadow-sm text-dark" style={{ backgroundColor: '#e2e3e5' }}>
           <PersonBadge /> 
           <span>
             Responsável: <strong>{user || 'N/A'}</strong> | 
             Centro de Custo: <strong>{centroCusto || 'N/A'}</strong>
           </span>
        </Alert>

        <div className="p-3 bg-white rounded shadow-sm border">
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-secondary small">CÓDIGO DE INVENTÁRIO</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light"><UpcScan /></InputGroup.Text>
                  <Form.Control
                    type="text"
                    value={inventoryCode}
                    onChange={(e) => setInventoryCode(e.target.value)}
                    disabled={isLoading}
                    className="fw-bold"
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-secondary small">Nº DE SÉRIE</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light">#</InputGroup.Text>
                  <Form.Control
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    disabled={isLoading}
                    placeholder="Opcional"
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-secondary small">DESCRIÇÃO DO ITEM</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light"><ListTask /></InputGroup.Text>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Cadeira Giratória Preta..."
                    autoFocus
                    disabled={isLoading}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={12}>
               <Form.Label className="fw-bold text-secondary small">LOCALIZAÇÃO FÍSICA</Form.Label>
               <InputGroup className="mb-2">
                  <InputGroup.Text className="bg-light"><GeoAlt /></InputGroup.Text>
                  <Form.Select 
                    value={selectedSector} 
                    onChange={handleSectorChange}
                    disabled={isLoading}
                  >
                    <option value="">Selecione o Setor...</option>
                    {Object.keys(locationsData).map((sector) => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </Form.Select>
                  <Form.Select 
                    value={selectedSubLocal} 
                    onChange={(e) => setSelectedSubLocal(e.target.value)}
                    disabled={!selectedSector || isLoading}
                  >
                    <option value="">Selecione o Ambiente...</option>
                    {availableSubLocals.map((sub, index) => (
                      <option key={index} value={sub}>{sub}</option>
                    ))}
                  </Form.Select>
               </InputGroup>
            </Col>

            <Col md={12} className="mt-2">
              <Form.Group className="mb-2">
                <Form.Label className="fw-bold text-secondary small">OBSERVAÇÕES</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light"><ChatLeftText /></InputGroup.Text>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Opcional: Alguma observação ou detalhe do item..."
                    disabled={isLoading}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
        </div>

        {error && (
          <Alert variant="danger" className="mt-3 mb-0 shadow-sm border-0">
            <strong>Erro:</strong> {error}
          </Alert>
        )}
      </Modal.Body>
      
      <Modal.Footer className="bg-white border-top-0">
        <Button variant="outline-secondary" onClick={handleClose} disabled={isLoading} className="px-4">
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={isLoading} className="px-4 shadow-sm">
          {isLoading ? (
            <><Spinner as="span" animation="border" size="sm" /> Salvando...</>
          ) : (
            'Confirmar Cadastro'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddNotFoundItemModal;