import React, { useState } from 'react';
import { Form, InputGroup, Button, Spinner } from 'react-bootstrap';
import { BsSearch } from 'react-icons/bs';

// Removida a prop 'onQrClick'
const InputArea = ({ onCodeSubmit, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!inputValue.trim()) return;
    onCodeSubmit(inputValue.trim());
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-4">
      <InputGroup>
        <Form.Control
          placeholder="Digite ou leia o código para consulta individual"
          aria-label="Código do ativo"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
        
        {/* O BOTÃO DE LER QR CODE FOI REMOVIDO DAQUI */}

        <Button variant="primary" type="submit" disabled={isLoading || !inputValue}>
          {isLoading ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            <BsSearch />
          )}
        </Button>
      </InputGroup>
    </Form>
  );
};

export default InputArea;