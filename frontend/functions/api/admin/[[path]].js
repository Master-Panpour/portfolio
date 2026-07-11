import {
  assertKv,
  clearLoginFailures,
  createSession,
  getConfiguredToken,
  getSession,
  isLoginLimited,
  isTokenConfigured,
  json,
  keys,
  loginCookies,
  logoutCookies,
  readProfile,
  recordLoginFailure,
  requireAuthorized,
  requireCsrf,
  saveProfile,
  sendSecurityAlert,
  timingSafeEqual,
  validateLoginBody
} from "../../_shared/admin.js";
import { DEFAULT_PROFILE } from "../../_shared/default-profile.js";

const responseWithCookies = (body, cookies, status = 200) => {
  const response = json(body, { status });
  for (const cookie of cookies) {
    response.headers.append("Set-Cookie", cookie);
  }
  return response;
};

const routePath = (context) => {
  const path = context.params.path;
  return Array.isArray(path) ? path.join("/") : path || "";
};

const queueSecurityAlert = (context, type, details = {}) => {
  const task = sendSecurityAlert(context, type, details).catch(() => undefined);
  if (typeof context.waitUntil === "function") {
    context.waitUntil(task);
    return;
  }
  return task;
};

const login = async (context) => {
  const kvError = assertKv(context.env);
  if (kvError) {
    return kvError;
  }
  if (!isTokenConfigured(context.env)) {
    return json({ error: "admin_token_required" }, { status: 503 });
  }
  if (await isLoginLimited(context.request, context.env)) {
    return json({ error: "rate_limited" }, { status: 429 });
  }

  const candidate = await validateLoginBody(context.request);
  const expected = getConfiguredToken(context.env);
  if (!candidate || !timingSafeEqual(expected, candidate)) {
    const failures = await recordLoginFailure(context.request, context.env);
    if (failures >= 5) {
      queueSecurityAlert(context, "admin-login-failure-threshold", { failures });
    }
    return json({ error: "unauthorized" }, { status: 401 });
  }

  await clearLoginFailures(context.request, context.env);
  const session = await getSession(context.request, context.env);
  const nextSession = session ?? (await createSession(context.env));
  queueSecurityAlert(context, "admin-login-success");
  return responseWithCookies({ status: "authenticated" }, loginCookies(nextSession));
};

const logout = async (context) => {
  const csrfError = await requireCsrf(context.request, context.env);
  if (csrfError) {
    return csrfError;
  }

  const session = await getSession(context.request, context.env);
  if (session) {
    await context.env.PORTFOLIO_KV.delete(`session:${session.sessionId}`);
  }

  return responseWithCookies({ status: "logged_out" }, logoutCookies());
};

const getProfile = async (context) => {
  const authError = await requireAuthorized(context.request, context.env);
  if (authError) {
    return authError;
  }
  return json(await readProfile(context.env, DEFAULT_PROFILE));
};

const putProfile = async (context) => {
  const csrfError = await requireCsrf(context.request, context.env);
  if (csrfError) {
    return csrfError;
  }
  return saveProfile(context.request, context.env);
};

const getLogs = async (context) => {
  const authError = await requireAuthorized(context.request, context.env);
  if (authError) {
    return authError;
  }

  const raw = await context.env.PORTFOLIO_KV.get(keys.logs);
  if (!raw) {
    return json([]);
  }
  try {
    const logs = JSON.parse(raw);
    return json(Array.isArray(logs) ? logs : []);
  } catch {
    return json([]);
  }
};

export async function onRequest(context) {
  const kvError = assertKv(context.env);
  if (kvError) {
    return kvError;
  }

  const path = routePath(context);
  const method = context.request.method.toUpperCase();

  if (path === "login" && method === "POST") {
    return login(context);
  }
  if (path === "logout" && method === "POST") {
    return logout(context);
  }
  if (path === "profile" && method === "GET") {
    return getProfile(context);
  }
  if (path === "profile" && method === "PUT") {
    return putProfile(context);
  }
  if (path === "logs" && method === "GET") {
    return getLogs(context);
  }

  return json({ error: "not_found" }, { status: 404 });
}
