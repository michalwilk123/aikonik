export function POST() {
  return Response.json(
    {
      error: "Publiczna rejestracja pierwszego administratora jest wyłączona.",
    },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}
