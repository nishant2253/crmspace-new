import React from "react";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "./button";
import { cn } from "../../lib/utils";

const AnimatedButton = React.forwardRef(
  ({ children, className, variant, size, onClick, ...props }, ref) => {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button
          ref={ref}
          className={cn(className)}
          variant={variant}
          size={size}
          onClick={onClick}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };
