import React from 'react';
import { motion } from 'framer-motion';

interface CircusNeonDecorationsProps {
  variant?: 'clown-face' | 'star' | 'balloon' | 'confetti';
  size?: 'small' | 'medium' | 'large';
  color?: 'red' | 'white' | 'orange';
  className?: string;
}

// Faccia di pagliaccio minimal neon
const ClownFace: React.FC<{ size: string; color: string }> = ({ size, color }) => {
  const strokeColor = color === 'red' ? '#ff4444' : color === 'orange' ? '#ff6b35' : '#ffffff';
  const glowColor = color === 'red' ? '#ff0000' : color === 'orange' ? '#ff6b35' : '#ffffff';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="neon-svg"
      style={{
        filter: `drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 8px ${glowColor})`,
      }}
    >
      {/* Faccia circolare */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        style={{
          filter: `drop-shadow(0 0 2px ${glowColor})`,
        }}
      />
      {/* Occhi */}
      <circle
        cx="40"
        cy="45"
        r="6"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
      />
      <circle
        cx="60"
        cy="45"
        r="6"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
      />
      {/* Naso a palloncino */}
      <ellipse
        cx="50"
        cy="55"
        rx="8"
        ry="10"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
      />
      {/* Bocca sorridente */}
      <path
        d="M 35 65 Q 50 75 65 65"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

// Stella neon
const Star: React.FC<{ size: string; color: string }> = ({ size, color }) => {
  const strokeColor = color === 'red' ? '#ff4444' : color === 'orange' ? '#ff6b35' : '#ffffff';
  const glowColor = color === 'red' ? '#ff0000' : color === 'orange' ? '#ff6b35' : '#ffffff';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="neon-svg"
      style={{
        filter: `drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 8px ${glowColor})`,
      }}
    >
      <path
        d="M 50 10 L 60 40 L 90 40 L 68 58 L 78 88 L 50 70 L 22 88 L 32 58 L 10 40 L 40 40 Z"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinejoin="round"
        style={{
          filter: `drop-shadow(0 0 2px ${glowColor})`,
        }}
      />
    </svg>
  );
};

// Palloncino neon
const Balloon: React.FC<{ size: string; color: string }> = ({ size, color }) => {
  const strokeColor = color === 'red' ? '#ff4444' : color === 'orange' ? '#ff6b35' : '#ffffff';
  const glowColor = color === 'red' ? '#ff0000' : color === 'orange' ? '#ff6b35' : '#ffffff';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="neon-svg"
      style={{
        filter: `drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 8px ${glowColor})`,
      }}
    >
      {/* Palloncino */}
      <ellipse
        cx="50"
        cy="40"
        rx="25"
        ry="30"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
      />
      {/* Corda */}
      <line
        x1="50"
        y1="70"
        x2="50"
        y2="90"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

// Confetti neon
const Confetti: React.FC<{ size: string; color: string }> = ({ size, color }) => {
  const strokeColor = color === 'red' ? '#ff4444' : color === 'orange' ? '#ff6b35' : '#ffffff';
  const glowColor = color === 'red' ? '#ff0000' : color === 'orange' ? '#ff6b35' : '#ffffff';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="neon-svg"
      style={{
        filter: `drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 8px ${glowColor})`,
      }}
    >
      {/* Confetti shapes */}
      <rect
        x="20"
        y="20"
        width="15"
        height="15"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        transform="rotate(45 27.5 27.5)"
      />
      <circle
        cx="60"
        cy="30"
        r="8"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      <path
        d="M 30 60 L 40 70 L 25 70 Z"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      <rect
        x="65"
        y="65"
        width="12"
        height="12"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    </svg>
  );
};

export const CircusNeonDecorations: React.FC<CircusNeonDecorationsProps> = ({
  variant = 'clown-face',
  size = 'medium',
  color = 'red',
  className = '',
}) => {
  const sizeMap = {
    small: '24px',
    medium: '32px',
    large: '48px',
  };

  const sizeValue = sizeMap[size];

  const renderIcon = () => {
    switch (variant) {
      case 'clown-face':
        return <ClownFace size={sizeValue} color={color} />;
      case 'star':
        return <Star size={sizeValue} color={color} />;
      case 'balloon':
        return <Balloon size={sizeValue} color={color} />;
      case 'confetti':
        return <Confetti size={sizeValue} color={color} />;
      default:
        return <ClownFace size={sizeValue} color={color} />;
    }
  };

  return (
    <motion.div
      className={`inline-block ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.1 }}
    >
      {renderIcon()}
    </motion.div>
  );
};

// Componente per decorazioni fluttuanti in background
export const FloatingCircusDecorations: React.FC = () => {
  const decorations = [
    { variant: 'clown-face' as const, x: '10%', y: '15%', delay: 0 },
    { variant: 'star' as const, x: '85%', y: '20%', delay: 0.5 },
    { variant: 'balloon' as const, x: '15%', y: '70%', delay: 1 },
    { variant: 'star' as const, x: '90%', y: '75%', delay: 1.5 },
    { variant: 'confetti' as const, x: '80%', y: '50%', delay: 2 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {decorations.map((dec, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            left: dec.x,
            top: dec.y,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: dec.delay,
            ease: 'easeInOut',
          }}
        >
          <CircusNeonDecorations
            variant={dec.variant}
            size="small"
            color={index % 2 === 0 ? 'red' : 'white'}
          />
        </motion.div>
      ))}
    </div>
  );
};

