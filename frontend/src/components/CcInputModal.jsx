import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

const CcInputModal = ({ show, onClose, onConfirm }) => {
  const [cc, setCc] = useState('');
  const [cracha, setCracha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const crachaInputRef = useRef(null);

  const handleConfirm = async () => {
    if (!cc.trim()) {
      setError('Por favor, digite o Centro de Custo.');
      return;
    }
    if (!cracha.trim()) {
      setError('Por favor, informe o crachá do responsável.');
      return;
    }

    setIsLoading(true);
    setError('');

    const isValid = await onConfirm(cc, cracha);
    
    setIsLoading(false);

    if (isValid) {
      handleClose();
    } else {
      setError('Centro de Custo inválido ou não encontrado. Tente novamente.');
    }
  };

  const handleClose = () => {
    setCc('');
    setCracha('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  const handleCcKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      crachaInputRef.current?.focus();
    }
  };

  const handleCrachaKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Iniciar Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Informe os dados abaixo para carregar os itens esperados e iniciar a contagem.</p>
        
        <Form.Group className="mb-3">
          <Form.Label>Centro de Custo</Form.Label>
          <Form.Control
            type="text"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="Ex: 1005ADMI03"
            autoFocus
            onKeyDown={handleCcKeyDown}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Crachá do Responsável</Form.Label>
          <Form.Control
            type="text"
            ref={crachaInputRef}
            value={cracha}
            onChange={(e) => setCracha(e.target.value)}
            placeholder="Digite o crachá"
            onKeyDown={handleCrachaKeyDown}
          />
        </Form.Group>

        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Confirmar e Iniciar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CcInputModal;