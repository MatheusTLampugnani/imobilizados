import React from 'react';
import { InputGroup, Form, Button, Spinner } from 'react-bootstrap';

const InputArea = ({ codigo, setCodigo, onConsultar, onQrClick, isLoading }) => {
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onConsultar();
    }
  };

  return (
    <InputGroup className="mb-3">
      <Form.Control
        placeholder="Digite o código do imobilizado (ex: 20000076)"
        aria-label="Código do imobilizado"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
      />
      <Button variant="primary" onClick={onConsultar} disabled={isLoading}>
        {isLoading ? (
          <>
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            <span className="visually-hidden">Loading...</span>
          </>
        ) : (
          '🔍 Consultar'
        )}
      </Button>
      <Button variant="secondary" onClick={onQrClick} disabled={isLoading}>
        📷 Ler QR Code
      </Button>
    </InputGroup>
  );
};

export default InputArea;