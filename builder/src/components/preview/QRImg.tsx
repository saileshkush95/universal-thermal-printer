import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRImg({ data, size }: { data: string; size: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    QRCode.toDataURL(data || " ", {
      width: size,
      margin: 1,
      color: { dark: "#000", light: "#fff" },
    }).then(setUrl).catch(() => setUrl(""));
  }, [data, size]);
  return url ? <img src={url} style={{ width: size, maxWidth: "100%" }} alt="QR" /> : null;
}
