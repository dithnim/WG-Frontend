import React, { useState, useRef, useEffect } from "react";

interface DropdownProps {
  trigger: React.ReactNode;
  menu: React.ReactNode[];
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, menu, className }) => {
  const [open, setOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`dropdown ${className || ""}`} ref={dropdownRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="dropdown-menu">
          {menu.map((menuItem, index) => (
            <div key={index} onClick={() => setOpen(false)}>
              {menuItem}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
