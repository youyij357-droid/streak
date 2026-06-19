export function GET() {
  const hasPublishableKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return Response.json({
    app: "streak",
    status: "ok",
    database:
      process.env.NEXT_PUBLIC_SUPABASE_URL && hasPublishableKey
        ? "configured"
        : "pending",
    timestamp: new Date().toISOString(),
  });
}
