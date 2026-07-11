const TEXT_ENCODER = new TextEncoder();
const SESSION_COOKIE = "NYXORA_SESSION";
const CSRF_COOKIE = "NYXORA_CSRF";
const SESSION_TTL_SECONDS = 30 * 60;
const MAX_PROFILE_BYTES = 128 * 1024;
const MAX_TOKEN_BYTES = 512;
const MAX_LOG_LINES = 200;
const LOGIN_WINDOW_SECONDS = 10 * 60;
const LOGIN_MAX_FAILURES = 5;
const ALERT_COOLDOWN_SECONDS = 15 * 60;

export const keys = {
  profile: "profile",
  logs: "access_logs"
};

export const json = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(init.headers ?? {})
    }
  });

export const readTextLimited = async (request, maxBytes) => {
  const body = await request.text();
  if (TEXT_ENCODER.encode(body).length > maxBytes) {
    throw new Error("request_too_large");
  }
  return body;
};

export const assertKv = (env) => {
  if (!env.PORTFOLIO_KV) {
    return json({ error: "kv_binding_required" }, { status: 503 });
  }
  return null;
};

export const getConfiguredToken = (env) => {
  const token = typeof env.PORTFOLIO_ADMIN_TOKEN === "string" ? env.PORTFOLIO_ADMIN_TOKEN.trim() : "";
  return token.length >= 24 ? token : "";
};

export const isTokenConfigured = (env) => getConfiguredToken(env).length >= 24;

export const parseCookies = (request) => {
  const header = request.headers.get("Cookie") ?? "";
  const cookies = new Map();
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name) {
      cookies.set(name, decodeURIComponent(value));
    }
  }
  return cookies;
};

export const timingSafeEqual = (expected, actual) => {
  const left = TEXT_ENCODER.encode(expected);
  const right = TEXT_ENCODER.encode(actual);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return diff === 0;
};

export const randomToken = (bytes = 32) => {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return btoa(String.fromCharCode(...buffer)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const cookie = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "SameSite=Strict", `Max-Age=${options.maxAge ?? SESSION_TTL_SECONDS}`];
  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }
  parts.push("Secure");
  return parts.join("; ");
};

export const clearCookie = (name) => `${name}=; Path=/; SameSite=Strict; Max-Age=0; HttpOnly; Secure`;

export const createSession = async (env) => {
  const sessionId = randomToken(36);
  const csrfToken = randomToken(32);
  await env.PORTFOLIO_KV.put(
    `session:${sessionId}`,
    JSON.stringify({ csrfToken, createdAt: new Date().toISOString() }),
    { expirationTtl: SESSION_TTL_SECONDS }
  );
  return { sessionId, csrfToken };
};

export const getSession = async (request, env) => {
  if (!env.PORTFOLIO_KV) {
    return null;
  }

  const cookies = parseCookies(request);
  const sessionId = cookies.get(SESSION_COOKIE);
  if (!sessionId || !/^[A-Za-z0-9_-]{32,160}$/.test(sessionId)) {
    return null;
  }

  const raw = await env.PORTFOLIO_KV.get(`session:${sessionId}`);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw);
    if (!session || typeof session.csrfToken !== "string") {
      return null;
    }
    await env.PORTFOLIO_KV.put(`session:${sessionId}`, raw, { expirationTtl: SESSION_TTL_SECONDS });
    return { sessionId, csrfToken: session.csrfToken };
  } catch {
    return null;
  }
};

export const isAuthorized = async (request, env) => {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = getConfiguredToken(env);
  if (token && timingSafeEqual(`Bearer ${token}`, authorization.trim())) {
    return true;
  }
  return Boolean(await getSession(request, env));
};

export const requireAuthorized = async (request, env) => {
  if (!(await isAuthorized(request, env))) {
    return json({ error: "unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer realm=\"Nyxora\"" } });
  }
  return null;
};

export const requireCsrf = async (request, env) => {
  const session = await getSession(request, env);
  if (!session) {
    return json({ error: "unauthorized" }, { status: 401 });
  }
  const csrfHeader = request.headers.get("X-CSRF-Token") ?? "";
  if (!timingSafeEqual(session.csrfToken, csrfHeader.trim())) {
    return json({ error: "csrf_required" }, { status: 403 });
  }
  return null;
};

export const loginCookies = ({ sessionId, csrfToken }) => [
  cookie(SESSION_COOKIE, sessionId, { httpOnly: true }),
  cookie(CSRF_COOKIE, csrfToken, { httpOnly: false })
];

export const logoutCookies = () => [clearCookie(SESSION_COOKIE), clearCookie(CSRF_COOKIE)];

export const readProfile = async (env, fallbackProfile) => {
  const raw = await env.PORTFOLIO_KV.get(keys.profile);
  if (!raw) {
    return fallbackProfile;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallbackProfile;
  } catch {
    return fallbackProfile;
  }
};

export const saveProfile = async (request, env) => {
  const body = await readTextLimited(request, MAX_PROFILE_BYTES);
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return json({ error: "invalid_json" }, { status: 400 });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return json({ error: "profile_object_required" }, { status: 400 });
  }

  const current = await env.PORTFOLIO_KV.get(keys.profile);
  if (current) {
    await env.PORTFOLIO_KV.put(`profile_backup:${Date.now()}`, current, { expirationTtl: 30 * 24 * 60 * 60 });
  }
  await env.PORTFOLIO_KV.put(keys.profile, JSON.stringify(parsed, null, 2));
  return json({ status: "saved" });
};

export const clientIp = (request) =>
  request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";

export const recordLoginFailure = async (request, env) => {
  const key = `login_fail:${clientIp(request)}`;
  const current = Number.parseInt((await env.PORTFOLIO_KV.get(key)) ?? "0", 10);
  const next = current + 1;
  await env.PORTFOLIO_KV.put(key, String(next), { expirationTtl: LOGIN_WINDOW_SECONDS });
  return next;
};

export const isLoginLimited = async (request, env) => {
  const key = `login_fail:${clientIp(request)}`;
  const current = Number.parseInt((await env.PORTFOLIO_KV.get(key)) ?? "0", 10);
  return current >= LOGIN_MAX_FAILURES;
};

export const clearLoginFailures = async (request, env) => {
  await env.PORTFOLIO_KV.delete(`login_fail:${clientIp(request)}`);
};

export const validateLoginBody = async (request) => {
  const body = (await readTextLimited(request, MAX_TOKEN_BYTES)).trim();
  return body.length <= MAX_TOKEN_BYTES ? body : "";
};

const safeField = (value, maxLength = 240) => {
  const text = typeof value === "string" ? value : "";
  return text.replace(/[\r\n]/g, " ").slice(0, maxLength);
};

const escapeHtml = (value) =>
  safeField(value, 800)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const alertConfig = (env) => {
  const apiKey = typeof env.NYXORA_ALERT_RESEND_API_KEY === "string" ? env.NYXORA_ALERT_RESEND_API_KEY.trim() : "";
  const to = typeof env.NYXORA_ALERT_TO === "string"
    ? env.NYXORA_ALERT_TO.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  const from = typeof env.NYXORA_ALERT_FROM === "string" ? env.NYXORA_ALERT_FROM.trim() : "";
  return apiKey && to.length > 0 && from ? { apiKey, to, from } : null;
};

const alertCooldownSeconds = (env) => {
  const raw = Number.parseInt(env.NYXORA_ALERT_COOLDOWN_SECONDS ?? "", 10);
  return Number.isFinite(raw) && raw >= 60 && raw <= 86400 ? raw : ALERT_COOLDOWN_SECONDS;
};

const alertTitle = (type) => {
  if (type === "admin-login-success") {
    return "Successful admin login";
  }
  if (type === "admin-login-failure-threshold") {
    return "Failed login threshold reached";
  }
  return "Admin security event";
};

const alertCooldownKey = (type, request) => `alert:${type}:${clientIp(request)}`;

export const sendSecurityAlert = async (context, type, details = {}) => {
  const config = alertConfig(context.env);
  if (!config || !context.env.PORTFOLIO_KV) {
    return;
  }

  const cooldownKey = alertCooldownKey(type, context.request);
  if (await context.env.PORTFOLIO_KV.get(cooldownKey)) {
    return;
  }

  await context.env.PORTFOLIO_KV.put(cooldownKey, new Date().toISOString(), {
    expirationTtl: alertCooldownSeconds(context.env)
  });

  const url = new URL(context.request.url);
  const timestamp = new Date().toISOString();
  const fields = {
    event: alertTitle(type),
    timestamp,
    ip: clientIp(context.request),
    path: url.pathname,
    method: context.request.method,
    userAgent: context.request.headers.get("User-Agent") ?? "unknown",
    referer: context.request.headers.get("Referer") ?? "none",
    ...details
  };

  const text = [
    "Nyxora admin security alert",
    "",
    `Event: ${fields.event}`,
    `Time: ${fields.timestamp}`,
    `IP: ${fields.ip}`,
    `Method: ${fields.method}`,
    `Path: ${fields.path}`,
    `User-Agent: ${fields.userAgent}`,
    `Referer: ${fields.referer}`,
    details.failures ? `Failures in window: ${details.failures}` : ""
  ].filter(Boolean).join("\n");

  const htmlRows = Object.entries(fields)
    .map(([key, value]) => `<tr><th align="left">${escapeHtml(key)}</th><td>${escapeHtml(String(value))}</td></tr>`)
    .join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.from,
      to: config.to,
      subject: `[Nyxora] ${alertTitle(type)}`,
      text,
      html: `<h2>Nyxora admin security alert</h2><table>${htmlRows}</table>`
    })
  });

  if (!response.ok) {
    await context.env.PORTFOLIO_KV.put(
      "alert:last_error",
      JSON.stringify({ ts: timestamp, status: response.status, event: type }),
      { expirationTtl: 24 * 60 * 60 }
    );
  }
};

export const logAccess = async (context) => {
  const env = context.env;
  if (!env.PORTFOLIO_KV) {
    return;
  }

  const url = new URL(context.request.url);
  const entry = {
    ts: new Date().toISOString(),
    method: safeField(context.request.method, 12),
    path: safeField(url.pathname, 160),
    remote: safeField(clientIp(context.request), 80),
    userAgent: safeField(context.request.headers.get("User-Agent") ?? ""),
    referer: safeField(context.request.headers.get("Referer") ?? "")
  };

  try {
    const raw = await env.PORTFOLIO_KV.get(keys.logs);
    const logs = raw ? JSON.parse(raw) : [];
    const nextLogs = Array.isArray(logs) ? [...logs.slice(-(MAX_LOG_LINES - 1)), entry] : [entry];
    await env.PORTFOLIO_KV.put(keys.logs, JSON.stringify(nextLogs));
  } catch {
    await env.PORTFOLIO_KV.put(keys.logs, JSON.stringify([entry]));
  }
};
