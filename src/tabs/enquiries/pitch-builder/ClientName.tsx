import React from 'react';

interface ClientNameProps {
  firstName: string;
  lastName: string;
}

const ClientName: React.FC<ClientNameProps> = ({ firstName, lastName }) => {
  return <span>{firstName} {lastName}</span>;
};

export default ClientName;
