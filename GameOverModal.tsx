import React from 'react';
import type { GameMode } from './types.ts';

interface GameOverModalProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onChangeMode: () => void;
  isGameWon?: boolean;
  gameMode?: GameMode;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, highScore, onRestart, onChangeMode, isGameWon, gameMode }) => {
  if (isGameWon) {
    return (
      <div className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex justify-center items-center z-10 modal-fade-in">
        <div className="bg-green-800 text-white p-6 md:p-8 rounded-lg shadow-2xl text-center w-11/12 max-w-sm">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-game text-yellow-300">You Win!</h2>
          <p className="text-lg mb-6">
            You conquered the Colestrol Challenge!
          </p>
          <p className="text-md mb-6 animate-pulse">
            <strong>Insane Mode</strong> has been unlocked!
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={onChangeMode}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 hover:scale-105"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isNewHighScore = score > 0 && score >= highScore;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex justify-center items-center z-10 modal-fade-in">
      <div className="bg-gray-700 text-white p-6 md:p-8 rounded-lg shadow-2xl text-center w-11/12 max-w-sm">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-game text-red-500">
          {gameMode === 'COLESTROL' ? 'Challenge Failed' : 'Game Over'}
        </h2>
        
        {isNewHighScore && gameMode !== 'COLESTROL' && (
            <p className="text-lg text-yellow-300 font-bold mb-4 animate-pulse">
              New High Score!
            </p>
        )}
        
        {gameMode !== 'COLESTROL' && (
          <p className="text-lg mb-6">
            Your Score: <span className="font-bold text-xl text-yellow-400">{score}</span>
          </p>
        )}
        
        {gameMode === 'COLESTROL' && (
           <p className="text-lg mb-6">Don't touch the spinach walls!</p>
        )}

        <div className="flex flex-col space-y-3">
          <button
            onClick={onRestart}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 hover:scale-105 text-lg"
          >
            Play Again
          </button>
          <button
            onClick={onChangeMode}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 hover:scale-105"
          >
            Change Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;