import { useState, useRef, useEffect } from 'react';

export const useDropdown = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  const calculateDropdownPosition = (buttonRect: DOMRect) => {
    const DROPDOWN_HEIGHT = 180;
    const DROPDOWN_WIDTH = 200;
    const VIEWPORT_PADDING = 16;

    let top = buttonRect.bottom + 8;
    let left = buttonRect.right - DROPDOWN_WIDTH;

    // Detectar si el dropdown se sale del viewport verticalmente (abajo)
    if (top + DROPDOWN_HEIGHT > window.innerHeight - VIEWPORT_PADDING) {
      // Mostrar arriba del botón
      top = buttonRect.top - DROPDOWN_HEIGHT - 8;
    }

    // Detectar si el dropdown se sale del viewport horizontalmente (derecha)
    if (left + DROPDOWN_WIDTH > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - DROPDOWN_WIDTH - VIEWPORT_PADDING;
    }

    // Detectar si el dropdown se sale del viewport horizontalmente (izquierda)
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    return { top, left };
  };

  const openDropdown = (customerId: string, ref: HTMLButtonElement | null) => {
    if (activeDropdown !== customerId && ref) {
      const rect = ref.getBoundingClientRect();
      const pos = calculateDropdownPosition(rect);
      setDropdownPos(pos);
      dropdownRefs.current[customerId] = ref;
    }
    setActiveDropdown(activeDropdown === customerId ? null : customerId);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  return {
    activeDropdown,
    dropdownPos,
    dropdownRefs,
    openDropdown,
    closeDropdown,
  };
};
