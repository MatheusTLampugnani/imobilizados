import React, { useState } from 'react';
import { Card, Spinner, Alert, Accordion, Table, Button } from 'react-bootstrap';
import EditInventoryModal from './EditInventoryModal';

const ResultsDisplay = ({ isLoading, error, resultado, onRefresh }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleEditClick = (item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleUpdateSuccess = () => {
    handleCloseModal();
    onRefresh();
  };

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
    <>
      <Card className="mt-4 shadow-sm border-0">
        <Card.Header as="h5" className="bg-danger text-white">
          CÓDIGO DO IMOBILIZADO: {resultado.codigo_imobilizado}
        </Card.Header>
        <Card.Body>
          <Accordion defaultActiveKey={resultado.itens[0]?.id.toString()} alwaysOpen className="mt-2">
            {resultado.itens.map((item) => (
              <Accordion.Item eventKey={item.id.toString()} key={item.id}>
                <Accordion.Header>
                  Item (Subnº {item['Subnº']}): {item.Descrição || 'Sem descrição'}
                </Accordion.Header>
                <Accordion.Body>
                  <Table striped bordered hover responsive size="sm">
                    <tbody>
                      <tr><td style={{ width: '30%' }}><strong>CÓDIGO DO IMOBILIZADO</strong></td><td>{item.codigo_imobilizado || 'Sem código'}</td></tr>
                      <tr><td style={{ width: '30%' }}><strong>DESCRIÇÃO</strong></td><td>{item.Descrição || 'Sem descrição'}</td></tr>
                      <tr><td><strong>DATA INCORPORAÇÃO</strong></td><td>{item.Data || 'Sem data de incorporação'}</td></tr>
                      <tr><td><strong>INVENTÁRIO</strong></td><td>{item.Inventário || 'Sem número de inventário'}</td></tr>
                      <tr><td><strong>INVENTÁRIO ANTIGO</strong></td><td>{item.Inventário_Antigo || 'Sem inventário anterior'}</td></tr>
                      <tr><td><strong>NÚMERO DE SÉRIE</strong></td><td>{item.Série || 'Sem número de série'}</td></tr>
                      <tr><td><strong>CENTRO DE CUSTO</strong></td><td>{item.CentroCusto || 'N/A'} - {item.CentroCustoNome || ''}</td></tr>
                      <tr><td><strong>SUB NÚMERO</strong></td><td>{item.Subnº}</td></tr>
                    </tbody>
                  </Table>
                  <div className="text-end mt-2">
                    <Button variant="outline-danger" size="sm" onClick={() => handleEditClick(item)}>
                      Editar Inventário
                    </Button>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Card.Body>
      </Card>

      {editingItem && (
        <EditInventoryModal
          show={showEditModal}
          onClose={handleCloseModal}
          item={editingItem}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );
};

export default ResultsDisplay;
