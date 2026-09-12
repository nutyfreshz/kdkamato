export const metadata = { title: "Viewport QA" };

function safePath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function ViewportQaPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string; w?: string; h?: string; scale?: string }>;
}) {
  const params = await searchParams;
  const path = safePath(params.path);
  const width = Math.min(2200, Math.max(320, Number(params.w) || 390));
  const height = Math.min(1400, Math.max(500, Number(params.h) || 844));
  const scale = Math.min(1, Math.max(0.4, Number(params.scale) || 1));

  return (
    <main style={{ minHeight: "100vh", margin: 0, padding: 24, background: "#202428", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: 14, fontSize: 13 }}>
        QA viewport: <strong>{width}×{height}</strong> · route <strong>{path}</strong> · scale <strong>{scale}</strong>
      </div>
      <div
        id="qa-frame-shell"
        style={{
          width: width * scale,
          height: height * scale,
          overflow: "hidden",
          border: "2px solid #48dce8",
          background: "#08090a",
          boxShadow: "0 14px 48px rgba(0,0,0,.4)",
        }}
      >
        <iframe
          id="qa-frame"
          title={`QA ${path} ${width}x${height}`}
          src={path}
          width={width}
          height={height}
          style={{
            display: "block",
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </main>
  );
}
