import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parsedEnv } from "./config-schema";

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_supabase) return _supabase;

  const url = parsedEnv.SUPABASE_URL;
  const anonKey = parsedEnv.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  _supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  });

  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (_supabaseAdmin) return _supabaseAdmin;

  const url = parsedEnv.SUPABASE_URL;
  const serviceRoleKey = parsedEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  _supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseAdmin;
}

export async function verifySupabaseSession(token: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function createSupabaseUser(email: string, password: string, metadata?: Record<string, unknown>) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin client not configured");

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return data.user;
}

export async function deleteSupabaseUser(uid: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin client not configured");

  const { error } = await admin.auth.admin.deleteUser(uid);
  if (error) throw new Error(`Failed to delete user: ${error.message}`);
}

export function getStorageBucket(bucket: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  return supabase.storage.from(bucket);
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: Blob | ArrayBuffer | Uint8Array,
  contentType?: string,
) {
  const storage = getStorageBucket(bucket);
  if (!storage) throw new Error("Supabase storage not configured");

  const { data, error } = await storage.upload(path, file, {
    contentType,
    upsert: true,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return data;
}

export async function getPublicUrl(bucket: string, path: string) {
  const storage = getStorageBucket(bucket);
  if (!storage) return null;

  const { data } = storage.getPublicUrl(path);
  return data.publicUrl;
}

export async function listFiles(bucket: string, prefix?: string) {
  const storage = getStorageBucket(bucket);
  if (!storage) return [];

  const { data, error } = await storage.list(prefix ?? "");
  if (error) return [];
  return data;
}
