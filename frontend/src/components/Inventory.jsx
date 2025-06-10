import React from 'react';
import { Card, Button, ListGroup, Badge } from 'react-bootstrap';

const Inventory = ({ inventario, setInventario, onClose }) => {
  const handleLimpar = () => {
    if (window.confirm('Tem certeza que deseja limpar o inventário?')) {
      setInventario([]);
    }
  };

  const handleExportar = () => {
  };

  return (
    <Card className="my-4">
      <Card.Header as="h5">📋 Inventário</Card.Header>
      <Card.Body>
        <p>Itens consultados nesta sessão:</p>
        <ListGroup>
          {inventario.length === 0 ? (
            <ListGroup.Item>Nenhum item no inventário.</ListGroup.Item>
          ) : (
            inventario.map((item, index) => (
              <ListGroup.Item key={index} as="li" className="d-flex justify-content-between align-items-start">
                <div className="ms-2 me-auto">
                  <div className="fw-bold">{item.codigo}</div>
                  {item.itens?.[0]?.Descrição || 'Sem descrição'}
                </div>
                <Badge bg="primary" pill>
                  {item.itens?.length || 0} itens
                </Badge>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Card.Body>
      <Card.Footer className="text-end">
        <Button variant="success" className="me-2" onClick={handleExportar}>📥 Exportar</Button>
        <Button variant="danger" className="me-2" onClick={handleLimpar}>🗑️ Limpar</Button>
        <Button variant="secondary" onClick={onClose}>❌ Fechar</Button>
      </Card.Footer>
    </Card>
  );
};

export default Inventory;