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
        Informações do Imobilizado: {resultado.codigo}
      </Card.Header>
      <Card.Body>
        <Card.Title>Total de Itens: {resultado.itens.length}</Card.Title>
        <Accordion defaultActiveKey="0" alwaysOpen className="mt-3">
          {resultado.itens.map((item, index) => (
            <Accordion.Item eventKey={index.toString()} key={index}>
              <Accordion.Header>
                Item {item.Número || index + 1}: {item.Descrição || 'Sem descrição'}
              </Accordion.Header>
              <Accordion.Body>
                <Table striped bordered hover responsive size="sm">
                  <tbody>
                    <tr>
                      <td style={{ width: '30%' }}><strong>Descrição</strong></td>
                      <td>{item.Descrição || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Data</strong></td>
                      <td>{item.Data || 'N/A'}</td>
                    </tr>
                    {item.Inventário && <tr><td><strong>Inventário</strong></td><td>{item.Inventário}</td></tr>}
                    {item.Série && <tr><td><strong>Série</strong></td><td>{item.Série}</td></tr>}
                    {item['Centro Custo'] && <tr><td><strong>Centro de Custo</strong></td><td>{item['Centro Custo']}</td></tr>}
                    {item['Subnº'] && <tr><td><strong>Subnúmero</strong></td><td>{item['Subnº']}</td></tr>}
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