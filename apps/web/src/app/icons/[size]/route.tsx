import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const ALLOWED = new Set([192, 512]);

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ size: string }> },
) {
  const { size: sizeStr } = await ctx.params;
  const size = Number(sizeStr);
  if (!ALLOWED.has(size)) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1e3a5f",
          color: "#fbbf24",
          fontSize: size * 0.34,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        FT
      </div>
    ),
    { width: size, height: size },
  );
}
