export function GET() {
  return Response.json({
    app: "streak",
    status: "ok",
    database: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "pending",
    timestamp: new Date().toISOString(),
  });
}
