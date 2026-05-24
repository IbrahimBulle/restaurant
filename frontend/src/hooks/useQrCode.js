import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function useQrCode(value, size = 320) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    if (!value) {
      setSrc("");
      return undefined;
    }
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: "#0f3d2f",
        light: "#fffdf7",
      },
    })
      .then((next) => {
        if (active) setSrc(next);
      })
      .catch(() => {
        if (active) setSrc("");
      });
    return () => {
      active = false;
    };
  }, [size, value]);

  return src;
}
