import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Simple health check endpoint.
 */
export async function GET() {
  return NextResponse.json({ status: "OK", timestamp: new Date().toISOString() });
}
