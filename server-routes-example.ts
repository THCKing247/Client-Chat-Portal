// Example: Add these routes to your Fastify server file
// Place them below your /bot-config route
// 
// Note: Make sure you have zod imported at the top of your file:
// import { z } from "zod";

// 1) GET /users - Get all users for the client
app.get("/users", { preHandler: requireUser }, async (req, reply) => {
  try {
    const user = (req as any).user;
    const clientId = await getClientIdForUser(user.id);

    const { data, error } = await supabaseAdmin
      .from("client_users")
      .select("id, role, user_id")
      .eq("client_id", clientId);

    if (error) return reply.code(500).send({ error: error.message });

    // Get emails from auth users (simple way: return user_id + role for now)
    return reply.send({ users: data });
  } catch {
    return reply.code(403).send({ error: "Not allowed" });
  }
});

// 2) POST /users/add - Add user to client by user UUID
// Note: Add this schema definition near your other zod schemas (usually at the top of the file)
const AddUserBody = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["owner", "admin", "agent"]),
});

app.post("/users/add", { preHandler: requireUser }, async (req, reply) => {
  const parsed = AddUserBody.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "Bad request" });

  try {
    const user = (req as any).user;
    const clientId = await getClientIdForUser(user.id);

    // Only owner can add
    const { data: me } = await supabaseAdmin
      .from("client_users")
      .select("role")
      .eq("client_id", clientId)
      .eq("user_id", user.id)
      .single();

    if (me?.role !== "owner") return reply.code(403).send({ error: "Owner only" });

    const { error } = await supabaseAdmin.from("client_users").insert({
      client_id: clientId,
      user_id: parsed.data.user_id,
      role: parsed.data.role,
    });

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ ok: true });
  } catch {
    return reply.code(403).send({ error: "Not allowed" });
  }
});

// 3) DELETE /users/:id - Remove user from client_users by row id
app.delete("/users/:id", { preHandler: requireUser }, async (req, reply) => {
  try {
    const user = (req as any).user;
    const clientId = await getClientIdForUser(user.id);
    const rowId = (req.params as any).id;

    // Only owner can remove
    const { data: me } = await supabaseAdmin
      .from("client_users")
      .select("role")
      .eq("client_id", clientId)
      .eq("user_id", user.id)
      .single();

    if (me?.role !== "owner") return reply.code(403).send({ error: "Owner only" });

    const { error } = await supabaseAdmin
      .from("client_users")
      .delete()
      .eq("id", rowId)
      .eq("client_id", clientId);

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ ok: true });
  } catch {
    return reply.code(403).send({ error: "Not allowed" });
  }
});

