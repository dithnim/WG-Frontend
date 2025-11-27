import React from "react";

interface AuthLoadingProps {
  message?: string;
}

const AuthLoading: React.FC<AuthLoadingProps> = ({
  message = "Loading...",
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f0f0f]/90 backdrop-blur-sm transition-all duration-300">
      <div className="relative flex flex-col items-center">
        {/* Outer rotating ring */}
        <div className="h-24 w-24 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-purple-500 border-l-transparent animate-spin"></div>

        {/* Inner reverse rotating ring */}
        <div className="absolute top-2 h-20 w-20 rounded-full border-4 border-t-transparent border-r-blue-400 border-b-transparent border-l-purple-400 animate-spin-reverse"></div>

        {/* Center pulsing dot */}
        <div className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-pulse"></div>

        {/* Loading text with typing animation effect */}
        <div className="mt-8 flex flex-col items-center">
          <h3 className="text-xl font-bold text-white tracking-widest animate-pulse">
            {message}
          </h3>
          <div className="mt-2 flex space-x-1">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLoading;
