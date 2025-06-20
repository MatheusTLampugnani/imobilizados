import React, { useState, useRef, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

const BatchScannerModal = ({ show, onScan, onClose, isAddingItem }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Este efeito garante que o campo de texto seja focado sempre que o modal abrir
  // ou após uma leitura ser concluída.
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // Pequeno delay para garantir que o modal está visível
      return () => clearTimeout(timer);
    }
  }, [show, isAddingItem]); // Roda quando o modal abre e quando o estado de 'loading' muda

  const handleSubmit = (event) => {
    event.preventDefault();
    if (inputValue.trim() && !isAddingItem) {
      onScan(inputValue.trim());
      setInputValue(''); // Limpa o campo para a próxima leitura
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Scanner de Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Aponte o leitor para o campo abaixo. O sistema adicionará um item atrás do outro.</p>
        <Form onSubmit={handleSubmit}>
          <Form.Control
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isAddingItem ? "Adicionando..." : "Aguardando leitura do código..."}
            autoFocus
            disabled={isAddingItem}
          />
          {/* Um botão de submit não é necessário, pois o "Enter" do leitor já aciona o formulário */}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Concluir
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BatchScannerModal;