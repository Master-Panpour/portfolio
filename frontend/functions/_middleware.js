import { logAccess } from "./_shared/admin.js";

const shouldLog = (request) => {
  const url = new URL(request.url);
  return !url.pathname.startsWith("/assets/")
    && !url.pathname.startsWith("/images/")
    && !url.pathname.startsWith("/resume/")
    && url.pathname !== "/thm-rooms.json";
};

export async function onRequest(context) {
  if (shouldLog(context.request)) {
    if (typeof context.waitUntil === "function") {
      context.waitUntil(logAccess(context));
    } else {
      await logAccess(context);
    }
  }

  return context.next();
}
