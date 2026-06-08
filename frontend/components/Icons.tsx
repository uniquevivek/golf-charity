import React from 'react';

export const GolfBallIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a7 7 0 0 0-7 7c0 3 1.5 5 3.5 6.5A11 11 0 0 0 4 22h16a11 11 0 0 0-4.5-6.5C17.5 14 19 12 19 9a7 7 0 0 0-7-7z" />
      <circle cx="9" cy="8" r="0.5" fill="currentColor" />
      <circle cx="15" cy="8" r="0.5" fill="currentColor" />
      <circle cx="12" cy="11" r="0.5" fill="currentColor" />
      <circle cx="10" cy="13" r="0.5" fill="currentColor" />
      <circle cx="14" cy="13" r="0.5" fill="currentColor" />
    </svg>
  );
};
