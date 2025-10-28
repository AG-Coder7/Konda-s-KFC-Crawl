import React from 'react';
import type { Direction } from './types.ts';

interface MobileControlsProps {
  onDirectionChange: (direction: Direction) => void;
  disabled: boolean;
}

const ArrowIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
);

const MobileControls: React.FC<MobileControlsProps> = ({ onDirectionChange, disabled }) => {
  const buttonClass = "bg-gray-700/60 rounded-full w-14 h-14 flex items-center justify-center active:bg-gray-600/80 disabled:opacity-40 transition-all";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, direction: Direction) => {
    e.preventDefault();
    if (disabled) return;
    onDirectionChange(direction);
  };

  return (
    <div className="grid grid-cols-3 grid-rows-3 w-44 h-44 mx-auto mt-2 md:hidden">
      <div className="col-start-2 row-start-1 flex justify-center items-center">
        <button onClick={(e) => handleClick(e, 'UP')} disabled={disabled} className={buttonClass} aria-label="Move up">
          <ArrowIcon className="h-7 w-7" />
        </button>
      </div>
      <div className="col-start-1 row-start-2 flex justify-center items-center">
        <button onClick={(e) => handleClick(e, 'LEFT')} disabled={disabled} className={buttonClass} aria-label="Move left">
          <ArrowIcon className="h-7 w-7 -rotate-90" />
        </button>
      </div>
      <div className="col-start-3 row-start-2 flex justify-center items-center">
        <button onClick={(e) => handleClick(e, 'RIGHT')} disabled={disabled} className={buttonClass} aria-label="Move right">
          <ArrowIcon className="h-7 w-7 rotate-90" />
        </button>
      </div>
      <div className="col-start-2 row-start-3 flex justify-center items-center">
        <button onClick={(e) => handleClick(e, 'DOWN')} disabled={disabled} className={buttonClass} aria-label="Move down">
          <ArrowIcon className="h-7 w-7 rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default MobileControls;