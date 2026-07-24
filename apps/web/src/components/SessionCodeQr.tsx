import { QRCodeSVG } from "qrcode.react";

function SessionCodeQr({
  code,
  size = 160,
  path,
}: {
  code: string;
  size?: number;
  path?: string;
}) {
  const joinUrl = `${window.location.origin}${path ?? `/?code=${code}`}`;

  return (
    <div className="inline-block border border-border bg-white p-2">
      <QRCodeSVG value={joinUrl} size={size} />
    </div>
  );
}

export default SessionCodeQr;
