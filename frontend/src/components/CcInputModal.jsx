import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

const CcInputModal = ({ show, onClose, onConfirm }) => {
  const [cc, setCc] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!cc.trim()) {
      setError('Por favor, digite o Centro de Custo.');
      return;
    }
    setIsLoading(true);
    setError('');

    // Chama a função de validação que veio do App.jsx
    const isValid = await onConfirm(cc);
    
    setIsLoading(false);

    if (isValid) {
      handleClose(); // Fecha o modal se a validação for bem-sucedida
    } else {
      setError('Centro de Custo inválido ou não encontrado. Tente novamente.');
    }
  };

  // Limpa os estados ao fechar
  const handleClose = () => {
    setCc('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Iniciar Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Digite o Centro de Custo para carregar os itens esperados e iniciar a contagem.</p>
        <Form.Control
          type="text"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          placeholder="Ex: 100005002"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        />
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
