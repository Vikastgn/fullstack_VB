import "@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((request) => {
  if (request.method !== "GET") {
    return Response.json(
      { error: "Method Not Allowed" },
      { status: 405, headers: { Allow: "GET" } },
    );
  }

  return Response.json({
    message: "hello, it-incubator",
    studentId: 3116,
  });
});
