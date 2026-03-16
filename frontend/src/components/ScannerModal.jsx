import React, { useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { Html5QrcodeScanner } from 'html5-qrcode';

const ScannerModal = ({ show, onClose, onScanSuccess }) => {
  useEffect(() => {
    if (show) {
      const scanner = new Html5QrcodeScanner(
        "leitor-qrcode",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (textoDecodificado) => {
          scanner.clear();
          onScanSuccess(textoDecodificado);
        },
        (erro) => {
        }
      );

      return () => {
        scanner.clear().catch(e => console.error("Erro ao desligar câmera.", e));
      };
    }
  }, [show, onScanSuccess]);

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton className="bg-danger text-white">
        <Modal.Title>Ler Código da Etiqueta</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div id="leitor-qrcode" style={{ width: '100%' }}></div>
        <p className="text-muted mt-3 small">
          Aponte a câmera para o QR Code ou Código de Barras do imobilizado.
        </p>
      </Modal.Body>
    </Modal>
  );
};

export default ScannerModal;