import React, { useContext } from 'react';
import { GameContext } from '..';

export const CurrentAction = () => {
  const { action } = useContext(GameContext);

  const text = {
    draw: 'Draw Tiles',
    place: 'Place Tiles',
    turnEnd: 'End Turn',
    scoring: 'Scoring',
    gameOver: 'Winner!',
  };

  return action.get && (<b>{text[action.get]}</b>);
};
