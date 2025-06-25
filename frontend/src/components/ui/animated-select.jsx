import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";

const AnimatedSelect = React.forwardRef(
  (
    {
      label,
      options = [],
      className,
      containerClassName,
      labelClassName,
      error,
      placeholder = "Select an option",
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value);

    const handleFocus = (e) => {
      setFocused(true);
      if (props.onFocus) props.onFocus(e);
    };

    const handleBlur = (e) => {
      setFocused(false);
      if (props.onBlur) props.onBlur(e);
    };

    const handleChange = (e) => {
      setHasValue(!!e.target.value);
      if (props.onChange) props.onChange(e);
    };

    return (
      <div className={cn("relative mb-4", containerClassName)}>
        {label && (
          <motion.label
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none z-10",
              focused || hasValue
                ? "text-xs text-blue-600 -top-2 bg-white px-1"
                : "text-gray-500 top-2",
              labelClassName
            )}
            initial={false}
            animate={
              focused || hasValue
                ? {
                    y: 0,
                    scale: 0.85,
                    color: focused ? "#2563EB" : "#6B7280",
                  }
                : { y: 0, scale: 1, color: "#6B7280" }
            }
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        <div className="relative">
          <motion.select
            className={cn(
              "w-full px-3 py-2 border rounded-md transition-all duration-200 appearance-none",
              focused
                ? "border-blue-500 shadow-sm shadow-blue-100 outline-none"
                : "border-gray-300",
              error && "border-red-500",
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </motion.select>
          <motion.div
            className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
            animate={{ rotate: focused ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} className="text-gray-500" />
          </motion.div>
        </div>
        {error && (
          <motion.p
            className="mt-1 text-xs text-red-500"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

AnimatedSelect.displayName = "AnimatedSelect";

export { AnimatedSelect };
