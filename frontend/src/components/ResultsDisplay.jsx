import React from 'react';
import { Card, Spinner, Alert, Accordion, Table } from 'react-bootstrap';

const ResultsDisplay = ({ isLoading, error, resultado }) => {
  if (isLoading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="danger" />
        <p className="mt-2 text-muted">Buscando informações...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="warning" className="mt-3">{error}</Alert>;
  }

  if (!resultado) {
    return null;
  }

  return (
    <Card className="mt-4 shadow-sm border-0">
      <Card.Header as="h5" className="bg-danger text-white">
        CÓDIGO DO IMOBILIZADO: {resultado.codigo_imobilizado}
      </Card.Header>
      <Card.Body>
        <Accordion defaultActiveKey="0" alwaysOpen className="mt-2">
          {resultado.itens.map((item) => (
            <Accordion.Item eventKey={item['Subnº']} key={item['Subnº']}>
              <Accordion.Header>
                Item (Subnº {item['Subnº']}): {item.Descrição || 'Sem descrição'}
              </Accordion.Header>
              <Accordion.Body>
                <Table striped bordered hover responsive size="sm">
                  <tbody>
                    <tr><td style={{ width: '30%' }}><strong>DESCRIÇÃO</strong></td><td>{item.Descrição || 'N/A'}</td></tr>
                    <tr><td><strong>DATA INCOMPORAÇÃO</strong></td><td>{item.Data || 'N/A'}</td></tr>
                    <tr><td><strong>INVENTÁRIO</strong></td><td>{item.Inventário || 'N/A'}</td></tr>
                    <tr><td><strong>NUMERO DE SÉRIE</strong></td><td>{item.Série || 'N/A'}</td></tr>
                    <tr><td><strong>CENTRO DE CUSTO</strong></td><td>{item.CentroCusto || 'N/A'}</td></tr>
                    <tr><td><strong>SUB NÚMERO</strong></td><td>{item.Subnº}</td></tr>
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