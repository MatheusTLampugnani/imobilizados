import React from 'react';
import { Card, Spinner, Alert, Accordion, Table } from 'react-bootstrap';

const ResultsDisplay = ({ isLoading, error, resultado }) => {
  if (isLoading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Buscando informações...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-3">{error}</Alert>;
  }

  if (!resultado) {
    return null;
  }

  return (
    <Card className="mt-4">
      <Card.Header as="h5">
        CÓDIGO DO IMOBILIZADO: {resultado.imobilizado}
      </Card.Header>
      <Card.Body>
        <Accordion defaultActiveKey="0" alwaysOpen className="mt-3">
          {resultado.itens.map((item, index) => (
            <Accordion.Item eventKey={index.toString()} key={index}>
              <Accordion.Header>
                Item {index + 1}: {item.Descrição || 'Sem descrição'}
              </Accordion.Header>
              <Accordion.Body>
                <Table striped bordered hover responsive size="sm">
                  <tbody>
                    <tr><td style={{ width: '30%' }}><strong>DESCRIÇÃO</strong></td><td>{item.Descrição || 'N/A'}</td></tr>
                    <tr><td><strong>DATA DE INCORPORAÇÃO</strong></td><td>{item.Data || 'N/A'}</td></tr>
                    <tr><td><strong>Nº DO INVENTÁRIO</strong></td><td>{item.Inventário || 'N/A'}</td></tr>
                    <tr><td><strong>Nº DE SÉRIE</strong></td><td>{item.Série || 'N/A'}</td></tr>
                    <tr><td><strong>CENTRO DE CUSTO</strong></td><td>{item.CentroCusto || 'N/A'}</td></tr>
                    <tr><td><strong>SUBNÚMERO</strong></td><td>{item.Subnumero}</td></tr>
                  </tbody>
                </Table>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </Card.Body>
    </Card>
  );
};

export default ResultsDisplay;