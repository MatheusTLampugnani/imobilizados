import React, { useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import imgSuccess from '../assets/verificado.png';
import imgError from '../assets/cruz.png';

const StatusModal = ({ show, onClose, type, message }) => {
  
  useEffect(() => {
    if (show && type === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, type, onClose]);

  return (
    <Modal show={show} onHide={onClose} centered size="sm" backdrop="static">
      <Modal.Body className="text-center p-4">
        <img 
          src={type === 'success' ? imgSuccess : imgError} 
          alt={type === 'success' ? "Sucesso" : "Erro"} 
          style={{ width: '80px', marginBottom: '15px' }}
        />
        <h5 className={type === 'success' ? "text-success" : "text-danger"}>
          {type === 'success' ? "Sucesso!" : "Erro!"}
        </h5>
        <p className="mb-0">{message}</p>
        
        {type === 'error' && (
          <button className="btn btn-secondary mt-3 btn-sm" onClick={onClose}>
            Fechar
          </button>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default StatusModal;