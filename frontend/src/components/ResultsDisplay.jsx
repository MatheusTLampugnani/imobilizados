import React, { useState } from 'react';
import { Card, Spinner, Alert, Accordion, Table, Button } from 'react-bootstrap';
import { PencilSquare } from 'react-bootstrap-icons';
import EditInventoryModal from './EditInventoryModal';

const ResultsDisplay = ({ isLoading, error, resultado, onRefresh, currentUser }) => {
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

  if (!resultado || !resultado.itens || resultado.itens.length === 0) {
    return null; 
  }

  const EditButton = ({ onClick, title }) => (
    <Button 
      size="sm"
      className="ms-2 border-0 shadow-sm d-flex align-items-center justify-content-center" 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title || "Editar"}
      style={{ 
          backgroundColor: '#ffffff', 
          color: '#ff0000',
          width: '32px',
          height: '32px',
          padding: 0,
          flexShrink: 0
      }}
    >
      <PencilSquare size={16} />
    </Button>
  );

  const tableStyle = {
      tableLayout: 'fixed',
      width: '100%',
      marginBottom: 0
  };

  const labelStyle = {
      width: '35%',
      minWidth: '160px',
      fontWeight: 'bold',
      backgroundColor: '#f8f9fa',
      verticalAlign: 'middle'
  };

  const cellStyle = {
      verticalAlign: 'middle',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      width: '65%'
  };

  return (
    <>
      <Card className="mt-4 shadow-sm border-0">
        <Card.Header as="h5" className="bg-danger text-white">
          IMOBILIZADOS ENCONTRADOS
        </Card.Header>
        <Card.Body>
          <Accordion defaultActiveKey={resultado.itens[0]?.id?.toString()} alwaysOpen className="mt-2">
            {resultado.itens.map((item) => (
              <Accordion.Item eventKey={item.id?.toString()} key={item.id}>
                <Accordion.Header>
                  <div style={{ whiteSpace: 'normal', lineHeight: '1.4', marginRight: '10px' }}>
                      <strong>Item (Subnº {item['Subnº'] || item.sub_numero}):</strong> {item.Descrição || item.descricao || 'Sem descrição'}
                  </div>
                </Accordion.Header>
                <Accordion.Body className="p-0">
                  <Table striped bordered hover responsive size="sm" style={tableStyle}>
                    <tbody>
                      <tr>
                        <td style={labelStyle}>CÓDIGO DO IMOBILIZADO</td>
                        <td style={cellStyle}>{item.codigo_imobilizado || 'Sem código'}</td>
                      </tr>
                      <tr>
                        <td style={labelStyle}>SUB NÚMERO</td>
                        <td style={cellStyle}>{item['Subnº'] || item.sub_numero || '0'}</td>
                      </tr>
                      <tr>
                        <td style={labelStyle}>DESCRIÇÃO</td>
                        <td style={cellStyle}>{item.Descrição || item.descricao || 'Sem descrição'}</td>
                      </tr>
                      <tr>
                        <td style={labelStyle}>DATA INCORPORAÇÃO</td>
                        <td style={cellStyle}>{item.Data || item.data_incorporacao || 'Sem data'}</td>
                      </tr>
                      
                      <tr>
                        <td style={labelStyle}>INVENTÁRIO</td>
                        <td style={cellStyle}>
                            <div className="d-flex justify-content-between align-items-center">
                                <span>{item.Inventário || item.codigo_inventario || 'Sem número'}</span>
                                <EditButton onClick={() => handleEditClick(item, 'inventory')} title="Editar Código de Inventário" />
                            </div>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style={labelStyle}>INVENTÁRIO ANTIGO</td>
                        <td style={cellStyle}>{item.Inventário_Antigo || item.inventario_antigo || '---'}</td>
                      </tr>

                      <tr>
                        <td style={labelStyle}>NÚMERO DE SÉRIE</td>
                        <td style={cellStyle}>
                            <div className="d-flex justify-content-between align-items-center">
                                <span>{item.Série || item.numero_serie || 'Sem número'}</span>
                                <EditButton onClick={() => handleEditClick(item, 'serial')} title="Editar Número de Série" />
                            </div>
                        </td>
                      </tr>

                      <tr>
                        <td style={labelStyle}>CENTRO DE CUSTO</td>
                        <td style={cellStyle}>
                            <div className="d-flex justify-content-between align-items-center">
                                <span style={{ marginRight: '10px' }}>
                                    {item.CentroCusto || item.centro_custo || 'N/A'} {item.CentroCustoNome ? `- ${item.CentroCustoNome}` : ''}
                                </span>
                                <EditButton onClick={() => handleEditClick(item, 'cost_center')} title="Editar Centro de Custo" />
                            </div>
                        </td>
                      </tr>
        
                      <tr>
                        <td style={labelStyle}>LOCAL</td>
                        <td style={cellStyle}>
                            <div className="d-flex justify-content-between align-items-center">
                                <span style={{ marginRight: '10px' }}>
                                    {item.Local || item.local || 'Não informado'}
                                </span>
                                <EditButton onClick={() => handleEditClick(item, 'local')} title="Editar Localização" />
                            </div>
                        </td>
                      </tr>                      
                    </tbody>
                  </Table>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Card.Body>
      </Card>
      
      <EditInventoryModal
        show={showEditModal}
        onClose={handleCloseModal}
        item={editingItem}
        editType={editType} 
        onUpdateSuccess={handleUpdateSuccess}
        currentUser={currentUser} 
      />
    </>
  );
};

export default ResultsDisplay;