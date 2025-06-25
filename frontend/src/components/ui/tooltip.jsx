import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

const Tooltip = ({
  children,
  content,
  position = "top",
  delay = 0.2,
  className,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positions = {
    top: { y: -10, x: 0 },
    bottom: { y: 10, x: 0 },
    left: { x: -10, y: 0 },
    right: { x: 10, y: 0 },
  };

  const tooltipClass = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-sm whitespace-nowrap",
              tooltipClass[position],
              className
            )}
            initial={{ opacity: 0, ...positions[position] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...positions[position] }}
            transition={{ duration: 0.2 }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { Tooltip };
