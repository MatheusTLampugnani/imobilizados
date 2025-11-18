import React from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import {X} from 'react-bootstrap-icons'

const InputArea = ({ codigo, setCodigo, onConsultar, onLimpar, isLoading }) => {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    onConsultar();
  };

  const handleClear = () => {
    setCodigo('');
    onLimpar();
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