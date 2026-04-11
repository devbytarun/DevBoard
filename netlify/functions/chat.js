const OpenAI = require("openai");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ reply: "Method not allowed" })
    };
  }

  const client = getClient();
  if (!client) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ reply: "Missing OPENAI_API_KEY in Netlify environment variables." })
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ reply: "Invalid JSON body." })
    };
  }

  const message = (body.message || "").trim();
  if (!message) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ reply: "message is required" })
    };
  }

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: message
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ reply: response.output_text || "No reply" })
    };
  } catch (error) {
    const status = Number(error?.status) || 500;
    const fallback =
      status === 401
        ? "OPENAI_API_KEY is invalid for this deployment."
        : "Failed to generate reply";

    return {
      statusCode: status >= 400 && status < 600 ? status : 500,
      headers: corsHeaders,
      body: JSON.stringify({ reply: fallback })
    };
  }
};
