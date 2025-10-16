// src/components/ui/avatar.tsx
import React from 'react';

interface AvatarProps {
  className?: string;
  children?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({ className, children }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);

export const AvatarImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <img src={src} alt={alt} className="aspect-square h-full w-full" />
);

export const AvatarFallback: React.FC<{ className?: string }> = ({ className, children }) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-muted ${className}`}>
    {children}
  </div>
);