// netlify/functions/api.ts
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  if (event.path?.includes("/v1/healthz") || event.path?.includes("/.netlify/functions/api")) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", ...cors },
      body: JSON.stringify({
        ok: true,
        service: "durmah-api",
        path: event.path,
        ts: new Date().toISOString()
      })
    };
  }

  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json", ...cors },
    body: JSON.stringify({ error: "Not found", path: event.path })
  };
};
