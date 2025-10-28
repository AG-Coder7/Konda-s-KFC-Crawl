import React, { useState } from 'react';
import type { Position, Direction, Food, GameMode } from './types.ts';
import {
  BOARD_SIZE,
  GRID_SIZE,
  FOOD_IMG_URL,
  GOLDEN_FOOD_IMG_URL,
  SNAKE_HEAD_B64,
  SNAKE_BODY_B64,
  SPINACH_WALL_B64,
} from './constants.ts';

interface GameBoardProps {
  snake: Position[];
  food: Food | null;
  obstacles: Position[];
  onDirectionChange: (direction: Direction) => void;
  direction: Direction;
  isPaused: boolean;
  isGameOver: boolean;
  countdown: number;
  gameMode: GameMode;
}

const getRotationForDirection = (direction: Direction) => {
  switch (direction) {
    case 'UP':
      return -90;
    case 'DOWN':
      return 90;
    case 'LEFT':
      return 180;
    case 'RIGHT':
      return 0;
    default:
      return 0;
  }
};

const GameBoard: React.FC<GameBoardProps> = ({ snake, food, obstacles, onDirectionChange, direction, isPaused, isGameOver, countdown, gameMode }) => {
  const [touchStart, setTouchStart] = useState<Position | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStart.x;
    const deltaY = touchEndY - touchStart.y;
    
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        onDirectionChange(deltaX > 0 ? 'RIGHT' : 'LEFT');
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        onDirectionChange(deltaY > 0 ? 'DOWN' : 'UP');
      }
    }

    setTouchStart(null);
  };
  
  return (
    <div
      className="relative bg-gray-800 border-4 border-gray-600 rounded-lg shadow-lg overflow-hidden game-board-grid"
      style={{
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        touchAction: 'none',
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isPaused && !isGameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
          <h2 className="text-3xl font-game text-glow">Paused</h2>
        </div>
      )}

      {countdown > 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
          <div key={countdown} className="countdown-text text-6xl text-white text-glow">
             {countdown === 1 ? 'GO!' : countdown - 1}
          </div>
        </div>
      )}

      {obstacles.map((obstacle, index) => (
        <div
          key={`obstacle-${index}`}
          className={`absolute rounded-sm shadow-md ${gameMode === 'COLESTROL' ? 'spinach-wall' : 'obstacle'}`}
          style={{
            width: GRID_SIZE,
            height: GRID_SIZE,
            left: obstacle.x * GRID_SIZE,
            top: obstacle.y * GRID_SIZE,
            backgroundImage: gameMode === 'COLESTROL' ? `url(${SPINACH_WALL_B64})` : 'none',
            backgroundSize: 'cover',
          }}
        />
      ))}

      {snake.map((segment, index) => (
        <div
          key={index}
          className={`absolute transition-transform duration-75 ${index > 0 ? 'snake-body-animated' : ''}`}
          style={{
            width: GRID_SIZE,
            height: GRID_SIZE,
            left: segment.x * GRID_SIZE,
            top: segment.y * GRID_SIZE,
            zIndex: 1,
            transform: index === 0 ? `rotate(${getRotationForDirection(direction)}deg)` : 'none',
            opacity: isGameOver ? 0.5 : 1,
          }}
        >
          <img
            src={index === 0 ? SNAKE_HEAD_B64 : SNAKE_BODY_B64}
            alt={index === 0 ? "Snake head" : "Snake body"}
            className="w-full h-full object-cover"
            style={{
              borderRadius: index === 0 ? '50%' : '25%',
            }}
          />
        </div>
      ))}
      
      {food && (
         <div
            className="absolute food-animated"
            style={{
              width: GRID_SIZE,
              height: GRID_SIZE,
              left: food.position.x * GRID_SIZE,
              top: food.position.y * GRID_SIZE,
              zIndex: 1,
            }}
          >
            <img
              src={food.type === 'golden' ? GOLDEN_FOOD_IMG_URL : FOOD_IMG_URL}
              alt="KFC Bucket"
              className="w-full h-full object-contain"
            />
          </div>
      )}
    </div>
  );
};

export default GameBoard;