import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

const CcInputModal = ({ show, onClose, onConfirm }) => {
  const [cc, setCc] = useState('');
  const [localFisico, setLocalFisico] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    const cleanCc = cc.trim();
    if (!cleanCc) {
      setError('Por favor, digite o Centro de Custo.');
      return;
    }

    setIsLoading(true);
    setError('');

    const isValid = await onConfirm(cleanCc, null, localFisico.trim());

    setIsLoading(false);

    if (isValid) {
      handleClose();
    } else {
      setError('Centro de Custo inválido ou não encontrado. Tente novamente.');
    }
  };

  const handleClose = () => {
    setCc('');
    setLocalFisico('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  const handleCcKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Iniciar Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Informe o Centro de Custo para iniciar o inventário.</p>

        <Form.Group className="mb-3">
          <Form.Label>Centro de Custo</Form.Label>
          <Form.Control
            type="text"
            value={cc}
            onChange={(e) => setCc(e.target.value.toUpperCase())}
            placeholder="Ex: 1005ADMI03"
            autoFocus
            onKeyDown={handleCcKeyDown}
            style={{ textTransform: 'uppercase' }}
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