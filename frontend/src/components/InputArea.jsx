import React from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

const InputArea = ({ codigo, setCodigo, onConsultar, isLoading }) => {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    onConsultar();
  };

  return (
    <div className="input-container"> 
      <Form onSubmit={handleFormSubmit}>
        <InputGroup size="lg">
          <Form.Control
            type="text"
            placeholder="Digite o código do ativo..."
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            aria-label="Código do imobilizado"
            autoFocus
          />
          {codigo && (
            <Button variant="outline-secundary" onClick={handleClear} title="Limpar busca">
              <X size={24}/>
            </Button>
          )}
          <Button type="submit" variant="danger" disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Consultar'}
          </Button>
        </InputGroup>
      </Form>
    </div>
  );

};

export default InputArea;