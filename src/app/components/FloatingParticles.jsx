"use client";

import ClientOnly from "./ClientOnly";

export default function FloatingParticles() {
  // Fixed particle positions to avoid hydration mismatch
  const particles = [
    { left: 15, top: 20, delay: 0.5, duration: 4 },
    { left: 85, top: 15, delay: 1.2, duration: 5 },
    { left: 25, top: 80, delay: 2.1, duration: 3.5 },
    { left: 75, top: 70, delay: 0.8, duration: 4.5 },
    { left: 45, top: 30, delay: 1.8, duration: 3.8 },
    { left: 65, top: 90, delay: 0.3, duration: 5.2 },
    { left: 10, top: 60, delay: 2.5, duration: 4.2 },
    { left: 90, top: 40, delay: 1.5, duration: 3.2 },
    { left: 35, top: 10, delay: 0.9, duration: 4.8 },
    { left: 55, top: 85, delay: 2.2, duration: 3.9 },
    { left: 20, top: 45, delay: 1.1, duration: 4.1 },
    { left: 80, top: 25, delay: 0.6, duration: 5.1 },
    { left: 40, top: 75, delay: 1.9, duration: 3.6 },
    { left: 70, top: 55, delay: 0.4, duration: 4.7 },
    { left: 30, top: 35, delay: 2.3, duration: 3.3 },
    { left: 60, top: 65, delay: 1.4, duration: 4.9 },
    { left: 5, top: 50, delay: 0.7, duration: 3.7 },
    { left: 95, top: 80, delay: 2.0, duration: 4.3 },
    { left: 50, top: 5, delay: 1.6, duration: 5.3 },
    { left: 25, top: 95, delay: 0.2, duration: 4.6 }
  ];

  return (
    <ClientOnly>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full opacity-20 animate-float ${
              i % 3 === 0 ? 'bg-purple-400' : i % 3 === 1 ? 'bg-pink-400' : 'bg-blue-400'
            }`}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>
    </ClientOnly>
  );
}