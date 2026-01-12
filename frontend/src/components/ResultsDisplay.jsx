import React, { useState } from 'react';
import { Card, Spinner, Alert, Accordion, Table, Button } from 'react-bootstrap';
import { PencilSquare } from 'react-bootstrap-icons';
import EditInventoryModal from './EditInventoryModal';

const ResultsDisplay = ({ isLoading, error, resultado, onRefresh }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editType, setEditType] = useState('inventory');

  const handleEditClick = (item, type) => {
    setEditingItem(item);
    setEditType(type);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleUpdateSuccess = () => {
    handleCloseModal();
    if (onRefresh) onRefresh();
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

  const EditButton = ({ onClick, title }) => (
    <Button 
      variant="link" 
      className="p-0 ms-2 text-decoration-none text-danger" 
      onClick={onClick}
      title={title || "Editar"}
      style={{ verticalAlign: 'middle' }}
    >
      <PencilSquare size={16} />
    </Button>
  );

  return (
    <>
      <Card className="mt-4 shadow-sm border-0">
        <Card.Header as="h5" className="bg-danger text-white">
          IMOBILIZADOS
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
                      <tr>
                        <td style={{ width: '30%' }}><strong>CÓDIGO DO IMOBILIZADO</strong></td>
                        <td>{item.codigo_imobilizado || 'Sem código'}</td>
                      </tr>
                      <tr>
                        <td><strong>DESCRIÇÃO</strong></td>
                        <td>{item.Descrição || 'Sem descrição'}</td>
                      </tr>
                      <tr>
                        <td><strong>DATA INCORPORAÇÃO</strong></td>
                        <td>{item.Data || 'Sem data de incorporação'}</td>
                      </tr>
                      <tr>
                        <td><strong>INVENTÁRIO</strong></td>
                        <td className="d-flex justify-content-between align-items-center border-0">
                            <span>{item.Inventário || 'Sem número de inventário'}</span>
                            <EditButton 
                                onClick={() => handleEditClick(item, 'inventory')} 
                                title="Editar Código de Inventário" 
                            />
                        </td>
                      </tr>
                      <tr>
                        <td><strong>INVENTÁRIO ANTIGO</strong></td>
                        <td>{item.Inventário_Antigo || 'Sem inventário anterior'}</td>
                      </tr>
                      <tr>
                        <td><strong>NÚMERO DE SÉRIE</strong></td>
                        <td className="d-flex justify-content-between align-items-center border-0">
                            <span>{item.Série || item.numero_serie || 'Sem número de série'}</span>
                            <EditButton 
                                onClick={() => handleEditClick(item, 'serial')} 
                                title="Editar Número de Série" 
                            />
                        </td>
                      </tr>
                      <tr>
                        <td><strong>CENTRO DE CUSTO</strong></td>
                        <td className="d-flex justify-content-between align-items-center border-0">
                            <span>{item.CentroCusto || 'N/A'} - {item.CentroCustoNome || ''}</span>
                            <EditButton 
                                onClick={() => handleEditClick(item, 'cost_center')} 
                                title="Editar Centro de Custo" 
                            />
                        </td>
                      </tr>
                      <tr>
                        <td><strong>LOCAL</strong></td>
                        <td>{item.Local || 'Não informado'}</td>
                      </tr>
                      <tr>
                        <td><strong>SUB NÚMERO</strong></td>
                        <td>{item['Subnº']}</td>
                      </tr>
                    </tbody>
                  </Table>
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
          editType={editType} 
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );
};

export default ResultsDisplay;