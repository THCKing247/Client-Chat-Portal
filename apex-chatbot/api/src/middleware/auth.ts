import type { FastifyRequest, FastifyReply } from "fastify";
import { supabaseAuth } from "../lib/supabase.js";

export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return reply.code(401).send({ error: "Missing Bearer token" });
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data?.user) {
    return reply.code(401).send({ error: "Invalid token" });
  }

  // Check if account is locked
  const userMetadata = data.user.user_metadata || {};
  if (userMetadata.account_locked === true) {
    return reply.code(403).send({ 
      error: "Your account has been locked. Please contact your account administrator." 
    });
  }

  (req as any).user = { id: data.user.id, email: data.user.email };
}
