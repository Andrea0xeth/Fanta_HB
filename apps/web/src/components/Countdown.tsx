import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - Date.now();
      
      if (difference <= 0) {
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 bg-gray-800/80 backdrop-blur rounded-xl flex items-center justify-center border border-gray-700">
        <span className="text-2xl font-bold text-gradient">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-2">
      {timeLeft.days > 0 && <TimeUnit value={timeLeft.days} label="Giorni" />}
      <TimeUnit value={timeLeft.hours} label="Ore" />
      <TimeUnit value={timeLeft.minutes} label="Min" />
      <TimeUnit value={timeLeft.seconds} label="Sec" />
    </div>
  );
};
