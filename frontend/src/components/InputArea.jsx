import React from 'react';
import { Form, InputGroup, Button, Spinner } from 'react-bootstrap';
import { BsSearch, BsQrCodeScan } from 'react-icons/bs';

const InputArea = ({ codigo, setCodigo, onConsultar, onQrClick, isLoading }) => {

  const handleSubmit = (event) => {
    event.preventDefault();
    onConsultar();
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-4">
      <InputGroup>
        <Form.Control
          placeholder="Digite ou leia o código para consulta individual"
          aria-label="Código do ativo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
        <Button variant="primary" type="submit" disabled={isLoading || !codigo}>
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