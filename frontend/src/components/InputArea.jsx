import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { X, Camera } from 'react-bootstrap-icons';
import ScannerModal from './ScannerModal'; 

const InputArea = ({ codigo, setCodigo, onConsultar, onLimpar, isLoading }) => {
  const [showScanner, setShowScanner] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onConsultar();
  };
  
  const handleClear = () => {
    setCodigo('');
    onLimpar();
  };

  const handleScan = (codigoLido) => {
    setCodigo(codigoLido);
    setShowScanner(false);
    onConsultar(codigoLido); 
  };  

  return (
    <div className="input-container mb-4"> 
      <Form onSubmit={handleFormSubmit}>
        <InputGroup size="lg" className="shadow-sm">
          <Form.Control
            type="text"
            placeholder="Digite o código do ativo..."
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            aria-label="Código do imobilizado"
            autoFocus
          />
          
          {codigo && (
            <Button variant="outline-secondary" onClick={handleClear} title="Limpar busca">
              <X size={24}/>
            </Button>
          )}

          <Button 
            variant="outline-secondary" 
            onClick={() => setShowScanner(true)} 
            title="Ler QR Code ou Código de Barras"
            className="px-3 bg-light"
          >
            <Camera size={24} className="text-dark" />
          </Button>

          <Button type="submit" variant="danger" disabled={isLoading} className="px-4">
            {isLoading ? 'Buscando...' : 'Consultar'}
          </Button>
        </InputGroup>
      </Form>
      <ScannerModal 
        show={showScanner} 
        onClose={() => setShowScanner(false)} 
        onScanSuccess={handleScan} 
      />
    </div>
  );
};

export default InputArea;