import { useEffect, useState } from "react";

export default function useIsMobile(breakpoint: number = 620) {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < breakpoint,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
