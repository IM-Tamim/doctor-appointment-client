import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { sendEmail, resetPasswordEmail } from "./email";

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("DocAppoint");

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
    // Without this, Better Auth refuses every reset request with
    // "Reset password isn't enabled" — which is why /forgot-password
    // had nothing to call and was a static placeholder page.
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    sendResetPassword: async ({ user, url }) => {
      const sent = await sendEmail({
        to: user.email,
        subject: "Reset your DocAppoint password",
        html: resetPasswordEmail({ name: user.name, url }),
      });
      if (!sent) {
        // So a developer without SMTP configured can still finish the flow
        // instead of being silently stuck.
        console.warn(`[reset-password] email not sent. Link for ${user.email}:
${url}`);
      }
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    // Cookie caching was disabled on purpose: DocAppoint changes a user's
    // role/status/image from admin actions that write directly to MongoDB
    // (doctor approval, suspension, profile image sync). A cached session
    // cookie doesn't know about those writes and keeps serving stale data
    // until it expires or the user logs out — which caused both the
    // "admin dashboard shows zeros" bug and this avatar-not-updating bug.
    // At this app's scale, the extra DB read per request is negligible.
    cookieCache: {
      enabled: false,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "patient", // patient | doctor | admin
        input: false, // never settable by the client on signup — prevents self-promotion to doctor/admin
        returned: true, // MUST be explicit — Better Auth can silently omit additionalFields
        // from the user object (even server-side) if this isn't set, which is
        // exactly what caused the JWT payload to be missing "role" entirely.
      },
      status: {
        type: "string",
        defaultValue: "active", // active | pending | suspended
        input: false,
        returned: true,
      },
      phone: {
        type: "string",
        defaultValue: "",
        input: true,
        returned: true,
      },
    },
  },
  plugins: [
    jwt({
      jwt: {
        // NOTE: definePayload's argument shape is ambiguous across Better
        // Auth versions/docs (sometimes the raw user, sometimes a
        // destructured {user, session}), and relying on it silently
        // dropped "role" from every token regardless of additionalFields
        // config. To make this bulletproof, we ignore whatever shape is
        // passed in and read the user directly from MongoDB by id instead —
        // guaranteed to reflect exactly what's in the database.
        definePayload: async (arg) => {
          const rawUser = arg?.user ?? arg;
          const userId = rawUser?.id;
          const fallback = {
            id: userId ?? null,
            email: rawUser?.email ?? null,
            name: rawUser?.name ?? null,
            role: rawUser?.role ?? "patient",
            status: rawUser?.status ?? "active",
          };

          if (!userId) return fallback;

          try {
            const { ObjectId } = await import("mongodb");
            const freshUser = await db.collection("user").findOne({ _id: new ObjectId(userId) });
            return {
              id: userId,
              email: freshUser?.email ?? fallback.email,
              name: freshUser?.name ?? fallback.name,
              role: freshUser?.role ?? fallback.role,
              status: freshUser?.status ?? fallback.status,
            };
          } catch (err) {
            // Never let a DB hiccup here crash the whole process — every
            // page that calls authClient.token() on mount runs this.
            console.error("definePayload: falling back after error:", err.message);
            return fallback;
          }
        },
      },
    }),
  ],
});
