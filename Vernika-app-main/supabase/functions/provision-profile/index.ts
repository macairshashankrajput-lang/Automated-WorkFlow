import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { importPKCS8, jwtVerify, SignJWT, createRemoteJWKSet } from "npm:jose";

const firebaseProjectId = "gen-lang-client-0833693805";
const firestoreDatabaseId = "ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f";
const issuer = `https://securetoken.google.com/${firebaseProjectId}`;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const firebaseKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function cleanString(value: unknown, fallback = "") { return typeof value === "string" ? value.trim() : fallback; }
function firestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === "object") return { mapValue: { fields: Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, firestoreValue(v)])) } };
  return { stringValue: String(value) };
}
function firestoreFields(value: Record<string, unknown>) { return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, firestoreValue(item)])); }

async function readPrivateSecret() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase server credentials are not configured.");
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_vernika_runtime_secret`, {
    method: "POST", headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_key: "FIREBASE_SERVICE_ACCOUNT_JSON" }),
  });
  if (!response.ok) throw new Error("Unable to read the private Firebase credential store.");
  const secret = await response.json();
  if (typeof secret !== "string" || !secret) throw new Error("Firebase credential is not configured in the private store.");
  return JSON.parse(secret);
}
async function serviceAccessToken(serviceAccount: Record<string, string>) {
  const key = await importPKCS8(serviceAccount.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/cloud-platform" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" }).setIssuer(serviceAccount.client_email).setSubject(serviceAccount.client_email)
    .setAudience(serviceAccount.token_uri).setIssuedAt().setExpirationTime("1h").sign(key);
  const response = await fetch(serviceAccount.token_uri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  if (!response.ok) throw new Error("Unable to obtain Firebase service authorization.");
  return (await response.json()).access_token as string;
}
async function firebaseRequest(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Firebase request failed (${response.status}).`);
  return body;
}
async function getCaller(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!idToken) throw new Error("Firebase Authentication is required.");
  const verified = await jwtVerify(idToken, firebaseKeys, { issuer, audience: firebaseProjectId });
  const serviceAccount = await readPrivateSecret();
  if (serviceAccount.project_id !== firebaseProjectId) throw new Error("The configured Firebase credential belongs to a different project.");
  const accessToken = await serviceAccessToken(serviceAccount);
  const adminPath = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${firestoreDatabaseId}/documents/admins/${verified.payload.user_id || verified.payload.sub}`;
  let isProfileAdmin = false;
  const adminResponse = await fetch(adminPath, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (adminResponse.ok) isProfileAdmin = true;
  const isClaimAdmin = verified.payload.admin === true;
  if (!isProfileAdmin && !isClaimAdmin) throw new Error("Administrator authorization is required.");
  return { uid: String(verified.payload.user_id || verified.payload.sub), email: String(verified.payload.email || ""), isClaimAdmin, accessToken, serviceAccount };
}
async function authLookup(email: string, token: string) {
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${firebaseProjectId}/accounts:lookup`;
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: [email] }) });
  const body = await response.json().catch(() => ({}));
  return response.ok ? body?.users?.[0] : null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const caller = await getCaller(request);
    const input = await request.json();
    const email = cleanString(input?.email).toLowerCase();
    const password = cleanString(input?.password);
    const name = cleanString(input?.name);
    const requestedRole = cleanString(input?.role, "employee").toLowerCase();
    const role = requestedRole === "admin" ? "admin" : requestedRole === "client" ? "client" : "employee";
    if (!email || !email.includes("@")) return json({ error: "A valid email address is required." }, 400);
    if (!name) return json({ error: "A profile name is required." }, 400);
    if (password && password.length < 8) return json({ error: "Passwords must contain at least 8 characters." }, 400);
    if (role === "admin" && !caller.isClaimAdmin) return json({ error: "Only a custom-claim administrator can provision another administrator." }, 403);

    const existing = await authLookup(email, caller.accessToken);
    let firebaseUid: string;
    let created = false;
    if (existing?.localId) {
      firebaseUid = existing.localId;
      const update: Record<string, unknown> = { localId: firebaseUid, displayName: name, disableUser: input?.loginEnabled === false, deleteAttribute: [] };
      if (password) update.password = password;
      if (role === "admin") update.customAttributes = JSON.stringify({ admin: true });
      await firebaseRequest(`https://identitytoolkit.googleapis.com/v1/projects/${firebaseProjectId}/accounts:update`, caller.accessToken, { method: "POST", body: JSON.stringify(update) });
    } else {
      if (!password) return json({ error: "A password is required when creating a new profile." }, 400);
      const createdUser = await firebaseRequest(`https://identitytoolkit.googleapis.com/v1/projects/${firebaseProjectId}/accounts`, caller.accessToken, { method: "POST", body: JSON.stringify({ email, password, displayName: name, disabled: input?.loginEnabled === false, customAttributes: role === "admin" ? JSON.stringify({ admin: true }) : undefined }) });
      firebaseUid = createdUser.localId;
      created = true;
    }

    const profileData = { ...input, id: firebaseUid, firebaseUid, email, name, role, username: cleanString(input?.username, email.split("@")[0]), loginEnabled: input?.loginEnabled !== false, updatedAt: new Date().toISOString(), provisionedByUid: caller.uid };
    delete (profileData as Record<string, unknown>).password;
    const collectionName = role === "client" ? "clients" : "employees";
    const documentPath = `projects/${firebaseProjectId}/databases/${firestoreDatabaseId}/documents/${collectionName}/${firebaseUid}`;
    await firebaseRequest(`https://firestore.googleapis.com/v1/${documentPath}`, caller.accessToken, { method: "PATCH", body: JSON.stringify({ fields: firestoreFields(profileData) }) });
    if (role === "admin") {
      const adminPath = `projects/${firebaseProjectId}/databases/${firestoreDatabaseId}/documents/admins/${firebaseUid}`;
      await firebaseRequest(`https://firestore.googleapis.com/v1/${adminPath}`, caller.accessToken, { method: "PATCH", body: JSON.stringify({ fields: firestoreFields({ uid: firebaseUid, email, role: "admin", updatedAt: new Date().toISOString() }) }) });
    }
    return json({ uid: firebaseUid, email, role, collection: collectionName, created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile provisioning failed.";
    const status = message.includes("required") || message.includes("authorization") ? 403 : 400;
    return json({ error: message }, status);
  }
});
