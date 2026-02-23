import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalProgressBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setVisible(true);
    setProgress(30);
    const t1 = setTimeout(() => setProgress(70), 100);
    const t2 = setTimeout(() => {
      setProgress(100);
      const t3 = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t3);
    }, 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] h-1 overflow-hidden bg-primary/20"
          style={{ pointerEvents: "none" }}
        >
          <motion.div
            className="h-full bg-primary shadow-lg shadow-primary/50"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
