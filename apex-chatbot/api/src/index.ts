import cors from "@fastify/cors";
import "dotenv/config";
import Fastify from "fastify";
import { z } from "zod";
import { requireUser } from "./middleware/auth.js";
import { supabaseAdmin } from "./lib/supabase.js";
import { openai } from "./lib/openai.js";
import { sendWelcomeEmail } from "./lib/email.js";

const app = Fastify({ logger: true });

app.register(cors, {
  origin: ["http://localhost:3001", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});


app.get("/health", async () => ({ ok: true }));

app.get("/me", { preHandler: requireUser }, async (req) => {
  const user = (req as any).user;
  return { user };
});

const ChatBody = z.object({
  message: z.string().min(1),
  conversation_id: z.string().uuid().optional(),
});

app.post("/chat", { preHandler: requireUser }, async (req, reply) => {
  const parsed = ChatBody.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "Bad request" });

  const { message, conversation_id } = parsed.data;
  const user = (req as any).user;

  // Load profile to get client_id
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    return reply.code(403).send({ error: "Profile not found" });
  }

  const client_id = profile.client_id;

  // Load bot config
  const { data: botConfig } = await supabaseAdmin
    .from("bot_configs")
    .select("system_prompt, max_output_tokens")
    .eq("client_id", client_id)
    .maybeSingle();

  const systemPrompt = botConfig?.system_prompt ?? "You are a helpful assistant.";
  const maxOutputTokens = botConfig?.max_output_tokens ?? 400;

  // Create conversation if needed
  let convoId = conversation_id;
  if (!convoId) {
    const { data: convo, error: convoErr } = await supabaseAdmin
      .from("conversations")
      .insert({ client_id, user_id: user.id, title: message.slice(0, 60) })
      .select("id")
      .single();

    if (convoErr || !convo) {
      return reply.code(500).send({ error: "Failed to create conversation" });
    }
    convoId = convo.id;
  }

  // Save user message
  await supabaseAdmin.from("messages").insert({
    client_id,
    conversation_id: convoId,
    user_id: user.id,
    role: "user",
    content: message,
  });

  // Pull last messages
  const { data: history } = await supabaseAdmin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", convoId)
    .order("created_at", { ascending: true })
    .limit(20);

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...(history ?? []).map((m) => ({ role: m.role as any, content: m.content })),
  ];

  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: maxOutputTokens,
  });

  const assistantText = completion.choices?.[0]?.message?.content ?? "No response.";

  // Save assistant message
  await supabaseAdmin.from("messages").insert({
    client_id,
    conversation_id: convoId,
    user_id: user.id,
    role: "assistant",
    content: assistantText,
  });

  return reply.send({ conversation_id: convoId, reply: assistantText });
});

const port = Number(process.env.PORT || 8080);

// Put near the top (or keep with other helpers)
async function getClientIdForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("client_users")
    .select("client_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.client_id) throw new Error("No client found for this user");

  return data.client_id as string;
}

// GET bot config for logged-in user's client
app.get("/bot-config", { preHandler: requireUser }, async (req, reply) => {
  try {
    const user = (req as any).user;
    const client_id = await getClientIdForUser(user.id);

    const { data, error } = await supabaseAdmin
      .from("bot_configs")
      .select("system_prompt, max_output_tokens, model, temperature")
      .eq("client_id", client_id)
      .maybeSingle();

    if (error) return reply.code(500).send({ error: error.message });

    // If no row yet, return defaults
    return reply.send({
      system_prompt: data?.system_prompt ?? "You are a helpful assistant.",
      max_output_tokens: data?.max_output_tokens ?? 400,
      model: data?.model ?? "gpt-4o-mini",
      temperature: Number(data?.temperature ?? 0.2),
    });
  } catch (e: any) {
    return reply.code(403).send({ error: e?.message ?? "Forbidden" });
  }
});

const UpdateBotConfigBody = z.object({
  system_prompt: z.string().min(1).max(8000),
  max_output_tokens: z.number().int().min(50).max(2000),
  model: z.string().min(1).max(64),
  temperature: z.number().min(0).max(1),
});

// PUT bot config for logged-in user's client
app.put("/bot-config", { preHandler: requireUser }, async (req, reply) => {
  const parsed = UpdateBotConfigBody.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "Bad request" });

  try {
    const user = (req as any).user;
    const client_id = await getClientIdForUser(user.id);

    // Optional: restrict models you allow clients to pick
    const allowedModels = new Set(["gpt-4o-mini", "gpt-4.1"]);
    if (!allowedModels.has(parsed.data.model)) {
      return reply.code(400).send({ error: "Model not allowed" });
    }

    const { error } = await supabaseAdmin
      .from("bot_configs")
      .upsert(
        {
          client_id,
          system_prompt: parsed.data.system_prompt,
          max_output_tokens: parsed.data.max_output_tokens,
          model: parsed.data.model,
          temperature: parsed.data.temperature,
        },
        { onConflict: "client_id" }
      );

    if (error) return reply.code(500).send({ error: error.message });

    return reply.send({ ok: true });
  } catch (e: any) {
    return reply.code(403).send({ error: e?.message ?? "Forbidden" });
  }
});

// GET users for logged-in user's client
app.get("/users", { preHandler: requireUser }, async (req, reply) => {
  try {
    const user = (req as any).user;
    const clientId = await getClientIdForUser(user.id);

    console.log("AUTH USER:", user.id);
    console.log("CLIENT ID:", clientId);

    const { data, error } = await supabaseAdmin
      .from("client_users")
      .select("id, role, user_id")
      .eq("client_id", clientId);

    if (error) return reply.code(500).send({ error: error.message });

    // Fetch email addresses, names, and locked status for each user
    const usersWithEmail = await Promise.all(
      (data || []).map(async (cu) => {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(cu.user_id);
          const user = authUser?.user;
          const metadata = user?.user_metadata || {};
          const name = metadata.full_name || metadata.name || metadata.display_name || null;
          return {
            ...cu,
            email: user?.email || "Unknown",
            name: name,
            account_locked: metadata.account_locked === true,
          };
        } catch {
          return {
            ...cu,
            email: "Unknown",
            name: null,
            account_locked: false,
          };
        }
      })
    );

    return reply.send({ users: usersWithEmail });
  } catch (e: any) {
    return reply.code(403).send({ error: e?.message ?? "Forbidden" });
  }
});

const AddUserBody = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["owner", "admin", "agent"]),
});

// POST add user to logged-in user's client
app.post("/users/add", { preHandler: requireUser }, async (req, reply) => {
  const parsed = AddUserBody.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "Bad request" });

  try {
    const user = (req as any).user;
    const clientId = await getClientIdForUser(user.id);

    const { error } = await supabaseAdmin.from("client_users").insert({
      client_id: clientId,
      user_id: parsed.data.user_id,
      role: parsed.data.role,
    });

    if (error) return reply.code(500).send({ error: error.message });

    return reply.send({ ok: true });
  } catch (e: any) {
    return reply.code(403).send({ error: e?.message ?? "Forbidden" });
  }
});

app.post("/users/add-by-email", { preHandler: requireUser }, async (req, reply) => {
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

    const body = req.body as any;
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "agent");
    const password = body.password ? String(body.password) : null;
    const firstName = body.first_name ? String(body.first_name).trim() : "";
    const lastName = body.last_name ? String(body.last_name).trim() : "";

    if (!email) return reply.code(400).send({ error: "Email required" });
    if (!firstName) return reply.code(400).send({ error: "First name required" });
    if (!lastName) return reply.code(400).send({ error: "Last name required" });
    if (!["owner", "admin", "agent"].includes(role)) {
      return reply.code(400).send({ error: "Invalid role" });
    }

    // Find the auth user by email
    const { data: found, error: findErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (findErr) return reply.code(500).send({ error: findErr.message });

    let match = found.users.find((u) => (u.email || "").toLowerCase() === email);
    let wasCreated = false;
    
    // If user doesn't exist, create them
    if (!match) {
      // Generate a random password if not provided
      const userPassword = password || Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + "A1!";
      
      const userMetadata: any = {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
      };
      
      // If password was provided, mark that user must reset password on first login
      if (password) {
        userMetadata.must_reset_password = true;
      }
      
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: userPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: userMetadata,
      });

      if (createErr) return reply.code(500).send({ error: createErr.message });
      if (!newUser.user) return reply.code(500).send({ error: "Failed to create user" });

      match = newUser.user;
      wasCreated = true;
    } else {
      // Update existing user's metadata with first and last name
      const currentMetadata = match.user_metadata || {};
      await supabaseAdmin.auth.admin.updateUserById(match.id, {
        user_metadata: {
          ...currentMetadata,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
        },
      });
    }

    // Link to client
    const { error } = await supabaseAdmin.from("client_users").insert({
      client_id: clientId,
      user_id: match.id,
      role,
    });

    if (error) {
      // Already exists is fine
      if (String(error.message).toLowerCase().includes("duplicate")) {
        return reply.send({ ok: true, note: "Already linked" });
      }
      return reply.code(500).send({ error: error.message });
    }

    // Send welcome email if user was just created
    if (wasCreated) {
      try {
        const loginUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        await sendWelcomeEmail(email, firstName, loginUrl);
      } catch (emailError) {
        // Log error but don't fail the request
        console.error("Failed to send welcome email:", emailError);
      }
    }

    return reply.send({ ok: true, created: wasCreated });
  } catch (e: any) {
    return reply.code(403).send({ error: e?.message ?? "Forbidden" });
  }
});

// POST send password reset email for a user in client_users
app.post("/users/:id/send-reset", { preHandler: requireUser }, async (req, reply) => {
  try {
    const user = (req as any).user;
    const clientId = await getClientIdForUser(user.id);
    const clientUserId = (req.params as any).id;

    // Verify the user belongs to this client
    const { data: clientUser, error: fetchErr } = await supabaseAdmin
      .from("client_users")
      .select("user_id")
      .eq("id", clientUserId)
      .eq("client_id", clientId)
      .single();

    if (fetchErr || !clientUser) {
      return reply.code(404).send({ error: "User not found" });
    }

    // Get user email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(clientUser.user_id);
    if (!authUser?.user?.email) {
      return reply.code(404).send({ error: "User email not found" });
    }

    // Generate password reset link
    const redirectTo = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password`;
    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: authUser.user.email,
      options: {
        redirectTo,
      },
    });

    if (error) return reply.code(500).send({ error: error.message });

    return reply.send({ ok: true });
  } catch (e: any) {
    return reply.code(403).send({ error: e?.message ?? "Forbidden" });
  }
});

// POST clear password reset flag (authenticated)
app.post("/auth/clear-password-reset-flag", { 
  preHandler: requireUser,
  schema: {
    body: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
}, async (req, reply) => {
  try {
    const user = (req as any).user;
    console.log("Clearing password reset flag for user:", user.id);
    
    // Get current user metadata
    const { data: authUser, error: getUserErr } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (getUserErr) {
      console.error("Error getting user:", getUserErr);
      return reply.code(500).send({ error: getUserErr.message });
    }
    if (!authUser?.user) {
      return reply.code(404).send({ error: "User not found" });
    }

    const currentMetadata = authUser.user.user_metadata || {};
    console.log("Current metadata:", currentMetadata);
    
    // Remove the must_reset_password flag
    const { data: updatedUser, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...currentMetadata,
        must_reset_password: false,
      },
    });

    if (updateErr) {
      console.error("Error updating user metadata:", updateErr);
      return reply.code(500).send({ error: updateErr.message });
    }

    console.log("Password reset flag cleared successfully");
    return reply.send({ ok: true });
  } catch (e: any) {
    console.error("Exception in clear-password-reset-flag:", e);
    return reply.code(500).send({ error: e?.message ?? "Internal server error" });
  }
});

// POST forgot password (public endpoint)
app.post("/auth/forgot-password", async (req, reply) => {
  try {
    const body = req.body as any;
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) return reply.code(400).send({ error: "Email required" });

    // Generate password reset link
    const redirectTo = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password`;
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo,
      },
    });

    // Always return success to prevent email enumeration
    return reply.send({ ok: true, message: "If the email exists, a reset link has been sent." });
  } catch (e: any) {
    // Still return success to prevent email enumeration
    return reply.send({ ok: true, message: "If the email exists, a reset link has been sent." });
  }
});

// PUT update user in client_users
app.put("/users/:id", { preHandler: requireUser }, async (req, reply) => {
  try {
    const user = (req as any).user;
    const clientId = await getClientIdForUser(user.id);
    const clientUserId = (req.params as any).id;

    // Verify the user belongs to this client
    const { data: clientUser, error: fetchErr } = await supabaseAdmin
      .from("client_users")
      .select("user_id")
      .eq("id", clientUserId)
      .eq("client_id", clientId)
      .single();

    if (fetchErr || !clientUser) {
      return reply.code(404).send({ error: "User not found" });
    }

    // Check current user's role - only owners and admins can lock accounts
    const { data: currentUser } = await supabaseAdmin
      .from("client_users")
      .select("role")
      .eq("client_id", clientId)
      .eq("user_id", user.id)
      .single();

    if (!currentUser) {
      return reply.code(403).send({ error: "User not found in client" });
    }

    const body = req.body as any;
    const firstName = body.first_name ? String(body.first_name).trim() : null;
    const lastName = body.last_name ? String(body.last_name).trim() : null;
    const role = body.role ? String(body.role) : null;
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const password = body.password ? String(body.password) : null;
    const accountLocked = body.account_locked !== undefined ? Boolean(body.account_locked) : null;

    // Only owners and admins can lock/unlock accounts
    if (accountLocked !== null && currentUser.role !== "owner" && currentUser.role !== "admin") {
      return reply.code(403).send({ error: "Only owners and admins can lock/unlock accounts" });
    }

    if (firstName !== null && !firstName) {
      return reply.code(400).send({ error: "First name cannot be empty" });
    }
    if (lastName !== null && !lastName) {
      return reply.code(400).send({ error: "Last name cannot be empty" });
    }
    if (role && !["owner", "admin", "agent"].includes(role)) {
      return reply.code(400).send({ error: "Invalid role" });
    }
    if (email && !email.includes("@")) {
      return reply.code(400).send({ error: "Invalid email format" });
    }

    // Update role in client_users if provided
    if (role) {
      const { error: roleErr } = await supabaseAdmin
        .from("client_users")
        .update({ role })
        .eq("id", clientUserId)
        .eq("client_id", clientId);

      if (roleErr) return reply.code(500).send({ error: roleErr.message });
    }

    // Get current user data
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(clientUser.user_id);
    if (!authUser?.user) {
      return reply.code(404).send({ error: "Auth user not found" });
    }

    const currentMetadata = authUser.user.user_metadata || {};
    const updateData: any = {};

    // Update email if provided
    if (email && email !== authUser.user.email) {
      updateData.email = email;
    }

    // Update password if provided (temporary password - requires reset)
    if (password) {
      // Validate password meets minimum requirements
      if (password.length < 6) {
        return reply.code(400).send({ error: "Password must be at least 6 characters long" });
      }
      updateData.password = password;
    }

    // Prepare user metadata updates
    const metadataUpdates: any = { ...currentMetadata };
    
    // Update password reset flag if password is provided
    if (password) {
      metadataUpdates.must_reset_password = true;
    }
    
    // Update name if provided
    if (firstName !== null || lastName !== null) {
      const newFirstName = firstName !== null ? firstName : (currentMetadata.first_name || "");
      const newLastName = lastName !== null ? lastName : (currentMetadata.last_name || "");
      metadataUpdates.first_name = newFirstName;
      metadataUpdates.last_name = newLastName;
      metadataUpdates.full_name = `${newFirstName} ${newLastName}`.trim();
    }
    
    // Update account locked status if provided
    if (accountLocked !== null) {
      metadataUpdates.account_locked = accountLocked;
    }
    
    // Only update metadata if there are changes
    if (password || firstName !== null || lastName !== null || accountLocked !== null) {
      updateData.user_metadata = metadataUpdates;
    }

    // Update user if there are changes
    if (Object.keys(updateData).length > 0) {
      const { data: updatedUser, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(clientUser.user_id, updateData);
      if (updateErr) {
        console.error("Error updating user:", updateErr);
        return reply.code(500).send({ error: updateErr.message || "Failed to update user" });
      }
      
      // If password was updated, verify it was set
      if (password && updatedUser?.user) {
        console.log("Password updated successfully for user:", clientUser.user_id);
      }
    }

    return reply.send({ ok: true });
  } catch (e: any) {
    return reply.code(403).send({ error: e?.message ?? "Forbidden" });
  }
});

// DELETE user from logged-in user's client
app.delete("/users/:id", { preHandler: requireUser }, async (req, reply) => {
  try {
    const user = (req as any).user;
    const clientId = await getClientIdForUser(user.id);
    const userId = (req.params as any).id;

    const { error } = await supabaseAdmin
      .from("client_users")
      .delete()
      .eq("id", userId)
      .eq("client_id", clientId);

    if (error) return reply.code(500).send({ error: error.message });

    return reply.send({ ok: true });
  } catch (e: any) {
    return reply.code(403).send({ error: e?.message ?? "Forbidden" });
  }
});

app.listen({ port, host: "0.0.0.0" }, () => {
  console.log(`Server running on http://localhost:${port}`);
});

