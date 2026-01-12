import React, { useState } from 'react';
import { Card, ListGroup, Badge, Button } from 'react-bootstrap';
import { PencilSquare } from 'react-bootstrap-icons';
import EditInventoryModal from './EditInventoryModal';

const ResultsDisplay = ({ data, onUpdateData }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editType, setEditType] = useState('inventory');

  if (!data || !data.itens || data.itens.length === 0) return null;

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setEditType(type);
    setShowEditModal(true);
  };

  const handleUpdateSuccess = (itemId, type, newValue) => {
    setShowEditModal(false);
    
    if (onUpdateData) {
        const updatedItens = data.itens.map(item => {
            if (item.id === itemId) {
                if (type === 'inventory') return { ...item, Inventário: newValue };
                if (type === 'cost_center') return { ...item, CentroCusto: newValue };
                if (type === 'serial') return { ...item, Série: newValue };
            }
            return item;
        });
        onUpdateData({ ...data, itens: updatedItens });
    }
  };

  return (
    <>
      <Card className="mt-3 shadow-sm">
        <Card.Header className="bg-dark text-white">
          <h5 className="mb-0">Resultado da Busca</h5>
        </Card.Header>
        <ListGroup variant="flush">
          {data.itens.map((item) => (
            <ListGroup.Item key={item.id}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="fw-bold text-primary">{item.Descrição}</h6>
                  <div className="mb-1 d-flex align-items-center">
                    <strong>Inventário:</strong>&nbsp;{item.Inventário || '---'}
                    <Button 
                        variant="link" 
                        className="p-0 ms-2 text-decoration-none text-muted"
                        onClick={() => handleEdit(item, 'inventory')}
                        title="Editar Inventário"
                    >
                        <PencilSquare size={14} />
                    </Button>
                  </div>
                  <div className="mb-1 d-flex align-items-center">
                    <strong>Série:</strong>&nbsp;{item.Série || item['Subnº'] || '---'}
                    <Button 
                        variant="link" 
                        className="p-0 ms-2 text-decoration-none text-muted"
                        onClick={() => handleEdit(item, 'serial')}
                        title="Editar Série"
                    >
                        <PencilSquare size={14} />
                    </Button>
                  </div>

                  <div className="mb-1 d-flex align-items-center">
                    <strong>Centro de Custo:</strong>&nbsp;{item.CentroCusto || '---'}
                    <Button 
                        variant="link" 
                        className="p-0 ms-2 text-decoration-none text-muted"
                        onClick={() => handleEdit(item, 'cost_center')}
                        title="Editar Centro de Custo"
                    >
                        <PencilSquare size={14} />
                    </Button>
                  </div>
                  
                  <div className="text-muted small">
                    Local: {item.Local || 'Não informado'}
                  </div>
                </div>
                
                <Badge bg="secondary">{item.codigo_imobilizado}</Badge>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card>

      <EditInventoryModal 
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        item={editingItem}
        editType={editType}
        onUpdateSuccess={handleUpdateSuccess}
      />
    </>
  );
};

export default ResultsDisplay;