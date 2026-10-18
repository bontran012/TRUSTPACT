import React from "react";

export function AvalancheIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      width="20" 
      height="20" 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <circle cx="16" cy="16" r="16" fill="#E84142" />
      <path
        d="M21.2 21.8H24.5L18.4 11.2C17.6 9.8 15.6 9.8 14.8 11.2L8.7 21.8H12L16.6 13.8L21.2 21.8Z"
        fill="white"
      />
      <path
        d="M17.8 21.8H15.4L13.1 17.8L14.3 15.7L17.8 21.8Z"
        fill="#E84142"
      />
    </svg>
  );
}

export function UsdcIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      width="20" 
      height="20" 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path
        d="M16 6C10.5 6 6 10.5 6 16C6 21.5 10.5 26 16 26C21.5 26 26 21.5 26 16C26 10.5 21.5 6 16 6ZM16 24.3C11.4 24.3 7.7 20.6 7.7 16C7.7 11.4 11.4 7.7 16 7.7C20.6 7.7 24.3 11.4 24.3 16C24.3 20.6 20.6 24.3 16 24.3Z"
        fill="white"
        opacity="0.3"
      />
      <path
        d="M16.8 12.8C15.2 12.8 14.2 13.5 14.2 14.6C14.2 17.4 20 16 20 19.3C20 20.9 18.5 21.8 16.6 21.8C14.8 21.8 13.6 20.9 13.3 19.8H14.8C15 20.4 15.7 20.8 16.6 20.8C17.7 20.8 18.4 20.3 18.4 19.4C18.4 16.8 12.7 18 12.7 14.7C12.7 13.3 14 12 16.2 12C17.8 12 18.9 12.7 19.2 13.8H17.6C17.4 13.2 16.8 12.8 16.8 12.8Z"
        fill="white"
      />
      <path d="M15.5 10.5H16.8V12.1H15.5V10.5Z" fill="white" />
      <path d="M15.5 21.8H16.8V23.5H15.5V21.8Z" fill="white" />
    </svg>
  );
}

export function AaveIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      width="20" 
      height="20" 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <circle cx="16" cy="16" r="16" fill="#10B981" />
      <path
        d="M16 8L8 23H11.2L12.9 19.8H19.1L20.8 23H24L16 8ZM14.1 17.5L16 13.8L17.9 17.5H14.1Z"
        fill="white"
      />
      <circle cx="13" cy="17" r="1.5" fill="#10B981" />
      <circle cx="19" cy="17" r="1.5" fill="#10B981" />
    </svg>
  );
}

export function SbtBadgeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      width="20" 
      height="20" 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <circle cx="16" cy="16" r="16" fill="url(#sbtGrad)" />
      <path
        d="M16 6L23 10V17C23 21.5 20 25.5 16 27C12 25.5 9 21.5 9 17V10L16 6Z"
        fill="#14141E"
        stroke="#F59E0B"
        strokeWidth="1.5"
      />
      <path
        d="M16 11L17.5 14.5L21.5 15L18.5 17.8L19.5 21.5L16 19.5L12.5 21.5L13.5 17.8L10.5 15L14.5 14.5L16 11Z"
        fill="#F59E0B"
      />
      <defs>
        <linearGradient id="sbtGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </svg>
  );
}
