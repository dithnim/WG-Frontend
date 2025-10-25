import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true);

    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4 overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#ff6300] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div
        className={`relative z-10 text-center max-w-lg mx-auto transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* 404 Number with glow effect */}
        <div className="relative mb-8">
          <h1 className="text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6300] via-purple-500 to-blue-500 animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 text-9xl md:text-[12rem] font-bold text-[#ff6300] opacity-20 blur-sm animate-ping">
            404
          </div>
        </div>

        {/* Error message */}
        <div
          className={`mb-8 transition-all duration-1000 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-400 text-lg mb-2">
            The page you're looking for seems to have vanished into the digital
            void.
          </p>
          <p className="text-gray-500 text-sm">
            Don't worry, even the best explorers sometimes take wrong turns!
          </p>
        </div>

        {/* Animated icon */}
        <div
          className={`mb-8 transition-all duration-1000 delay-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <div className="relative inline-block">
            <i className="bx bx-error-circle text-6xl text-[#ff6300] animate-bounce"></i>
            <div className="absolute inset-0 text-6xl text-[#ff6300] opacity-30 blur-sm animate-ping">
              <i className="bx bx-error-circle"></i>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center mb-8 transition-all duration-1000 delay-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <button
            onClick={handleGoHome}
            className="group relative px-8 py-3 bg-gradient-to-r from-[#ff6300] to-orange-600 text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#ff6300]/25 focus:outline-none focus:ring-2 focus:ring-[#ff6300] focus:ring-opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-[#ff6300] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center justify-center gap-2">
              <i className="bx bx-home-alt text-xl"></i>
              Go Home
            </span>
          </button>

          <button
            onClick={handleGoBack}
            className="group relative px-8 py-3 bg-transparent border-2 border-gray-600 text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:border-[#ff6300] hover:shadow-lg hover:shadow-[#ff6300]/10 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            <div className="absolute inset-0 bg-[#ff6300] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <span className="relative flex items-center justify-center gap-2">
              <i className="bx bx-arrow-back text-xl"></i>
              Go Back
            </span>
          </button>
        </div>

        {/* Auto redirect countdown */}
        <div
          className={`text-center transition-all duration-1000 delay-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-700">
            <div className="relative">
              <div className="w-4 h-4 bg-[#ff6300] rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-4 h-4 bg-[#ff6300] rounded-full animate-ping opacity-30"></div>
            </div>
            <span className="text-gray-300 text-sm">
              Redirecting to home in{" "}
              <span className="text-[#ff6300] font-bold">{countdown}</span>{" "}
              seconds
            </span>
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-[#ff6300] rounded-full opacity-30 animate-bounce`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      <style>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
