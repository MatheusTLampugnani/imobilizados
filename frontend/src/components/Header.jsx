import React from 'react';
import logo from '../assets/videplast-brand.png';
import { Image } from 'react-bootstrap';

const Header = () => {
  return (
    <header className="text-center p-3 mb-4 border-bottom">
      <Image src={logo} alt="Videplast Logo" height="60" className="mb-3" />
      <h1 className="display-5">Consulta de Imobilizados</h1>
      <p className="text-muted">Videplast Rio Verde</p>
    </header>
  );
};

export default Header;