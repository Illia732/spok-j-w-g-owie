'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

// Kilka predefiniowanych, efektownych blobs
const blobs = [
  "M60,-80C80,-65,95,-30,85,-10C75,10,45,30,25,50C5,70,-15,90,-40,80C-65,70,-80,40,-75,15C-70,-10,-45,-20,-25,-45C-5,-70,40,-95,60,-80Z",
  "M55,-70C75,-60,90,-20,70,0C50,20,15,15,-5,35C-25,55,-60,65,-70,45C-80,25,-60,0,-50,-20C-40,-40,5,-65,25,-75C45,-85,35,-80,55,-70Z",
  "M60,-80C85,-55,80,0,60,20C40,40,10,60,-10,80C-30,100,-60,85,-80,55C-100,25,-90,-10,-70,-35C-50,-60,15,-95,40,-85C65,-75,35,-60,60,-80Z"
]

export function AbstractBlobAvatar({
  size = 140,
  animate = true
}: {
  size?: number
  animate?: boolean
}) {
  const idx = useMemo(() => Math.floor(Math.random()*blobs.length), []);
  const path = blobs[idx];
  const grad = useMemo(() => {
    const c1 = "#8ecae6", c2="#3a86ff";
    return [c1, c2];
  }, []);

  return (
    <motion.svg
      width={size} height={size}
      viewBox="-100 -100 200 200"
      style={{ borderRadius: "100%", boxShadow: "0 2px 12px #cbd5e1", background: `linear-gradient(135deg,${grad[0]},${grad[1]})` }}
      animate={animate ? { rotate: [0, 360] } : undefined}
      transition={animate ? { duration: 9, repeat: Infinity, ease: "linear" } : undefined}
    >
      <motion.path
        d={path}
        fill={"rgba(255,255,255,0.56)"}
        stroke={"rgba(0,0,0,0.04)"}
        strokeWidth={2}
        animate={animate ? {
          d: [
            blobs[(idx+0)%blobs.length],
            blobs[(idx+1)%blobs.length],
            blobs[(idx+2)%blobs.length],
            blobs[(idx+0)%blobs.length],
          ]
        }
        : undefined}
        transition={animate ? { duration: 7, repeat: Infinity, ease: "easeInOut" } : undefined}
      />
    </motion.svg>
  );
}
