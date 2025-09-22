import React from "react";

interface ProgressmenuProps {
  message: string;
}

const Progressmenu: React.FC<ProgressmenuProps> = ({ message }) => {
  return (
    <div className="absolute bottom-4 right-8 rounded-xl bg-[#262626] p-4 flex items-center">
      <h2 className="mb-2 text-lg font-semibold text-white">{message}</h2>
    </div>
  );
};

export default Progressmenu;
