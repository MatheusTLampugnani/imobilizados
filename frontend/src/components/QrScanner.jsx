import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { Modal, Button, Alert } from 'react-bootstrap';

const QrScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  let stream = null;
  let animationFrameId = null;

  useEffect(() => {
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true);
          await videoRef.current.play();
          animationFrameId = requestAnimationFrame(tick);
        }
      } catch (err) {
        setCameraError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      }
    };

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          onScan(code.data.trim());
        } else {
          animationFrameId = requestAnimationFrame(tick);
        }
      } else {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    startCamera();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [onScan]);

  return (
    <Modal show={true} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Ler QR Code</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {cameraError ? (
          <Alert variant="danger">{cameraError}</Alert>
        ) : (
          <div style={{ position: 'relative', width: '100%', paddingTop: '75%' /* 4:3 Aspect Ratio */ }}>
            <video ref={videoRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '8px' }} />
             <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '60%', height: '60%', border: '2px solid white', borderRadius: '16px',
                boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.5)'
            }}></div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        <p className="mt-3">Posicione o QR code no centro da tela.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QrScanner;