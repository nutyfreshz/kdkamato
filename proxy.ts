import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/home/:path*",
    "/program/:path*",
    "/progress/:path*",
    "/account/:path*",
    "/login",
    "/auth/callback"
  ],
};
