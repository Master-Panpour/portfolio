import { isAuthorized, logAccess } from "./_shared/admin.js";

const ADMIN_PAGE_PATHS = new Set(["/nyxora", "/nyxora/", "/nyxora.html"]);

const shouldLog = (request) => {
  const url = new URL(request.url);
  return !url.pathname.startsWith("/assets/")
    && !url.pathname.startsWith("/images/")
    && !url.pathname.startsWith("/resume/")
    && url.pathname !== "/thm-rooms.json";
};

const redirect = (request, target) => {
  const url = new URL(request.url);
  url.pathname = target;
  url.search = "";
  return Response.redirect(url.toString(), 302);
};

const guardNyxoraPage = async (context) => {
  const url = new URL(context.request.url);

  if (ADMIN_PAGE_PATHS.has(url.pathname) && !(await isAuthorized(context.request, context.env))) {
    return redirect(context.request, "/nyxora-login");
  }

  return null;
};

export async function onRequest(context) {
  if (shouldLog(context.request)) {
    if (typeof context.waitUntil === "function") {
      context.waitUntil(logAccess(context));
    } else {
      await logAccess(context);
    }
  }

  const guardResponse = await guardNyxoraPage(context);
  if (guardResponse) {
    return guardResponse;
  }

  return context.next();
}
