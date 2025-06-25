import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

const FadeIn = ({
  children,
  className,
  delay = 0,
  staggerItems = false,
  ...props
}) => {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ delay }}
      {...props}
    >
      {staggerItems
        ? React.Children.map(children, (child) => (
            <motion.div variants={itemVariants}>{child}</motion.div>
          ))
        : children}
    </motion.div>
  );
};

export { FadeIn, itemVariants };
