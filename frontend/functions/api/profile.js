import { assertKv, json, readProfile } from "../_shared/admin.js";
import { DEFAULT_PROFILE } from "../_shared/default-profile.js";

export async function onRequestGet({ env }) {
  const kvError = assertKv(env);
  if (kvError) {
    return json(DEFAULT_PROFILE);
  }

  const profile = await readProfile(env, DEFAULT_PROFILE);
  return json(profile, { headers: { "Cache-Control": "public, max-age=60" } });
}

export function onRequest() {
  return json({ error: "method_not_allowed" }, { status: 405 });
}
