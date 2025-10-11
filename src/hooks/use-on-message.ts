/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";

export const useOnMessage = (
  callback: (type: string, payload?: any) => void,
) => {
  useEffect(() => {
    const handleMessage = (
      event: MessageEvent<{ __SA?: { type: string; payload: unknown } }>,
    ) => {
      if (event.data.__SA) {
        const { type, payload } = event.data.__SA;
        if (typeof type === "string") {
          callback(type, payload);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [callback]);
};
