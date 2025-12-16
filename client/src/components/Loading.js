import React from 'react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
      <div className="spinner mb-4"></div>
      <p className="text-gray">{message}</p>
    </div>
  );
};

export default Loading;
