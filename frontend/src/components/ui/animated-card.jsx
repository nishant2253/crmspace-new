import React from "react";
import { motion } from "framer-motion";
import { Card } from "./card";
import { cn } from "../../lib/utils";

const AnimatedCard = React.forwardRef(
  ({ children, className, variant, ...props }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
          delay: props.delay || 0,
        }}
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
        whileHover={{
          y: -5,
          boxShadow:
            "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        }}
      >
        <Card ref={ref} className={cn("overflow-hidden", className)} {...props}>
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

export { AnimatedCard };
