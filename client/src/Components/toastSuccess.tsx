import React from "react";

interface ToastSuccessProps {
  message: string;
  type?: string;
  onClose: () => void;
}

const toastSuccess: React.FC<ToastSuccessProps> = ({
  message,
  type = "success",
  onClose,
}) => {
  return (
    <div
      id="toast-success"
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down flex items-center w-full max-w-xs px-4 py-2 mb-4 text-gray-500 bg-white rounded-full shadow-sm dark:text-gray-400 dark:bg-[#171717]"
      role="alert"
    >
      <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-full dark:bg-green-800 dark:text-green-200">
        <svg
          className="w-5 h-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
        </svg>
        <span className="sr-only">Success icon</span>
      </div>
      <div className="ms-3 text-sm font-normal">{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="ms-auto -mx-1.5 -my-1.5 text-black rounded-full focus:ring-2 focus:ring-gray-300 inline-flex items-center justify-center h-4 w-4 bg-[#5f5f5f] p-1"
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <svg
          className="w-3 h-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 14"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
          />
        </svg>
      </button>
    </div>
  );
};

export default toastSuccess;
