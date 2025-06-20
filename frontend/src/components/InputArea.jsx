import React, { useState } from 'react';
import { Form, InputGroup, Button, Spinner } from 'react-bootstrap';
// Para usar um ícone, você pode instalar a biblioteca react-icons com: npm install react-icons
import { BsQrCodeScan, BsSearch } from 'react-icons/bs';

const InputArea = ({ onCodeSubmit, onQrClick, isLoading }) => {
  // 1. Lógica da versão "nova": O componente gerencia o seu próprio estado de input.
  const [inputValue, setInputValue] = useState('');

  // 2. Lógica da versão "nova": Uma função 'handleSubmit' para o formulário.
  //    Isso captura tanto o clique no botão quanto o "Enter" do leitor de código de barras.
  const handleSubmit = (event) => {
    event.preventDefault(); // Previne que a página recarregue
    if (!inputValue.trim()) return; // Não faz nada se o campo estiver vazio
    onCodeSubmit(inputValue.trim());
  };

  return (
    // 3. Estrutura da versão "antiga" (com React-Bootstrap), mas envolta por um <Form>
    <Form onSubmit={handleSubmit} className="mb-4">
      <InputGroup>
        <Form.Control
          placeholder="Digite ou leia o código do ativo"
          aria-label="Código do ativo"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          autoFocus // Foca no campo ao carregar, essencial para o leitor de código de barras
        />

        {/* Botão para ler QR Code da versão "antiga", mantendo a prop 'onQrClick' */}
        <Button variant="outline-secondary" onClick={onQrClick} disabled={isLoading} aria-label="Ler QR Code com a câmera">
          <BsQrCodeScan />
          <span className="d-none d-md-inline ms-2">Ler QR Code</span>
        </Button>

        {/* Botão de consulta da versão "antiga", agora com type="submit" */}
        <Button variant="primary" type="submit" disabled={isLoading || !inputValue}>
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="visually-hidden">Consultando...</span>
            </>
          ) : (
            <>
              <BsSearch />
              <span className="d-none d-md-inline ms-2">Consultar</span>
            </>
          )}
        </Button>
      </InputGroup>
    </Form>
  );
};

export default InputArea;