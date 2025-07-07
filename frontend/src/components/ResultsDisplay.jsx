import React, { useState } from 'react';
import { Card, Table, Spinner, Alert, Button, Collapse } from 'react-bootstrap';
import EditInventoryModal from './EditInventoryModal';

// Componente para uma linha da tabela, para melhor organização
const TableRow = ({ item, onEditClick }) => (
    <tr>
        <td>{item["Subnº"] || 'N/A'}</td>
        <td>{item.Descrição || 'Sem descrição'}</td>
        <td>{item.Inventário || 'N/A'}</td>
        <td>{item.Série || 'N/A'}</td>
        <td>{item.CentroCusto || 'N/A'}</td>
        <td>
            <Button variant="outline-danger" size="sm" onClick={() => onEditClick(item)}>
                Editar
            </Button>
        </td>
    </tr>
);

const ResultsDisplay = ({ isLoading, error, resultado, onRefresh }) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [open, setOpen] = useState(true); // Controla o colapso da tabela

    const handleEditClick = (item) => {
        setSelectedItem(item);
        setShowEditModal(true);
    };

    const handleUpdateSuccess = () => {
        setShowEditModal(false);
        onRefresh(); // Atualiza os dados após a edição
    };

    if (isLoading) {
        return <div className="text-center my-4"><Spinner animation="border" variant="danger" /></div>;
    }

    if (error) {
        return <Alert variant="warning" className="mt-3">{error}</Alert>;
    }

    if (!resultado || resultado.itens.length === 0) {
        return null; // Não mostra nada se não houver resultado
    }

    return (
        <>
            <Card className="mt-4 shadow-sm">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    Resultado da Consulta (Cód. Imobilizado: {resultado.codigo_imobilizado})
                    <Button
                        onClick={() => setOpen(!open)}
                        aria-controls="collapse-table"
                        aria-expanded={open}
                        size="sm"
                        variant="light"
                    >
                        {open ? 'Ocultar' : 'Mostrar'}
                    </Button>
                </Card.Header>
                <Collapse in={open}>
                    <div id="collapse-table">
                        <Table striped bordered hover responsive="md" className="results-table">
                            <thead>
                                <tr>
                                    <th>Subnº</th>
                                    <th>Descrição</th>
                                    <th>Inventário</th>
                                    <th>Série</th>
                                    <th>Centro de Custo</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultado.itens.map(item => (
                                    <TableRow key={item.id} item={item} onEditClick={handleEditClick} />
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Collapse>
            </Card>

            {showEditModal && (
                <EditInventoryModal
                    show={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    item={selectedItem}
                    onUpdateSuccess={handleUpdateSuccess}
                />
            )}
        </>
    );
};

export default ResultsDisplay;