import React from 'react';

export const Score = ({ label, value }) => {
  return (
    <div className="Score flex columns just-centered">
      <b className="centered">{label}</b>
      <div className="ScoreValue centered">{value}</div>
    </div>
  );
};

export default Score