import { useEffect, useMemo, useState } from 'react';

interface Particle {
  id: number;
  angle: number;
  distance: number;
  delay: number;
  scale: number;
}

interface RewardBurstProps {
  triggerKey: number | string | null;
  color?: string;
}

export function RewardBurst({ triggerKey, color = '#a855f7' }: RewardBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (triggerKey == null) {
      return;
    }
    const nextParticles: Particle[] = Array.from({ length: 14 }).map((_, index) => ({
      id: index,
      angle: Math.random() * 360,
      distance: 40 + Math.random() * 40,
      delay: Math.random() * 120,
      scale: 0.6 + Math.random() * 0.8,
    }));
    setParticles(nextParticles);
    const timer = window.setTimeout(() => setParticles([]), 800);
    return () => window.clearTimeout(timer);
  }, [triggerKey]);

  const particleStyle = useMemo(() => ({
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
  }), [color]);

  if (!particles.length) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {particles.map((particle) => (
        <span
          key={`${triggerKey}-${particle.id}`}
          className="absolute h-2 w-2 rounded-full opacity-0 animate-[reward-burst_700ms_ease-out_forwards]"
          style={{
            ...particleStyle,
            transform: `translate(-50%, -50%) rotate(${particle.angle}deg) translate(${particle.distance}px) scale(${particle.scale})`,
            animationDelay: `${particle.delay}ms`,
            top: '50%',
            left: '50%',
          }}
        />
      ))}
    </div>
  );
}

