import { motion } from 'framer-motion';
import { useMemo } from 'react';

export default function FloatingLeaves() {
  const leavesData = useMemo(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      initialX: Math.random() * width,
      animateX: Math.random() * width,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {leavesData.map((leaf) => (
        <motion.div
          key={leaf.id}
          initial={{
            y: -100,
            x: leaf.initialX,
            rotate: 0,
            opacity: 0
          }}
          animate={{
            y: (typeof window !== 'undefined' ? window.innerHeight : 768) + 100,
            x: leaf.animateX,
            rotate: 360,
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            delay: leaf.delay,
            ease: "linear"
          }}
          className="absolute w-6 h-6 bg-secondary/30 rounded-full blur-[2px]"
          style={{
            borderRadius: '50% 0 50% 50%'
          }}
        />
      ))}
    </div>
  );
}
