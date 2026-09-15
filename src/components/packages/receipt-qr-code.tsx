"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function ReceiptQrCode({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: 96,
        margin: 0,
        color: { dark: "#1B2A4A", light: "#FFFFFF" },
      });
    }
  }, [value]);

  return <canvas ref={canvasRef} className="h-24 w-24" />;
}
