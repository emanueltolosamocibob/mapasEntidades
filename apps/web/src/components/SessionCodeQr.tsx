import { QRCodeSVG } from "qrcode.react";

function SessionCodeQr({ code, size = 160 }: { code: string; size?: number }) {
  const joinUrl = `${window.location.origin}/?code=${code}`;

  return (
    <div className="inline-block border border-border bg-white p-2">
      <QRCodeSVG value={joinUrl} size={size} />
    </div>
  );
}

export default SessionCodeQr;
