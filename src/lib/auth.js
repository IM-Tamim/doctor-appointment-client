import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt, emailOTP } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { sendEmail, resetPasswordEmail, otpEmail } from "./email.js";

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db(process.env.DB_NAME || "DocAppoint");

// ── Verification-code throttling ─────────────────────────────────────────
// Kept in MongoDB rather than memory because Netlify runs this in short-lived
// serverless instances that don't share memory.
const OTP_EXPIRES_SECONDS = 600; // 10 minutes
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_SENDS_PER_HOUR = 5;
const otpThrottle = db.collection("otpThrottle");

/**
 * Runs before every send of a verification code. It has to happen *before*
 * the endpoint: Better Auth stores the code before calling
 * sendVerificationOTP, so refusing inside that callback would leave the user
 * holding a stale code. Sends triggered by sign-in run as background tasks, so
 * there a cooldown just skips the email (the earlier code is still valid)
 * instead of failing the sign-in.
 */
const enforceOtpResendLimits = async (email) => {
  const record = await otpThrottle.findOne({ _id: email });
  if (!record) return;
  const now = Date.now();
  const sinceLast = (now - new Date(record.lastSentAt).getTime()) / 1000;
  if (sinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
    const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - sinceLast);
    throw new APIError("TOO_MANY_REQUESTS", {
      message: `Please wait ${wait} seconds before requesting another code.`,
      code: "OTP_RESEND_COOLDOWN",
    });
  }
  const inWindow = now - new Date(record.windowStart).getTime() < 3600 * 1000;
  if (inWindow && record.count >= OTP_MAX_SENDS_PER_HOUR) {
    throw new APIError("TOO_MANY_REQUESTS", {
      message: "Too many codes requested for this email. Try again in an hour.",
      code: "OTP_HOURLY_LIMIT",
    });
  }
};

const recordOtpSend = async (email, record) => {
  const now = new Date();
  const freshWindow = !record || now - new Date(record.windowStart) >= 3600 * 1000;
  await otpThrottle.updateOne(
    { _id: email },
    freshWindow
      ? { $set: { lastSentAt: now, windowStart: now, count: 1 } }
      : { $set: { lastSentAt: now }, $inc: { count: 1 } },
    { upsert: true }
  );
};

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
    // Accounts can't sign in until the emailed 6-digit code is entered.
    // Google sign-ups arrive with emailVerified=true, so they skip this.
    requireEmailVerification: true,
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
  emailVerification: {
    sendOnSignUp: true,
    // An unverified user who signs in gets a fresh code instead of a dead end.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  // Off by default outside production; on everywhere so the OTP endpoints'
  // per-IP limits (3/min) also apply in dev.
  rateLimit: {
    enabled: true,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/email-otp/send-verification-otp") return;
      const email = String(ctx.body?.email || "").trim().toLowerCase();
      if (email) await enforceOtpResendLimits(email);
    }),
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
    emailOTP({
      otpLength: 6,
      expiresIn: OTP_EXPIRES_SECONDS,
      allowedAttempts: 5,
      // Replaces the default link-based verification email with a code.
      overrideDefaultEmailVerification: true,
      // A resend re-sends the same still-valid code instead of invalidating
      // the one already in the user's inbox.
      resendStrategy: "reuse",
      sendVerificationOTP: async ({ email, otp }) => {
        await recordOtpSend(email, await otpThrottle.findOne({ _id: email }));

        const sent = await sendEmail({
          to: email,
          subject: "Your DocAppoint verification code",
          html: otpEmail({ otp, minutes: Math.round(OTP_EXPIRES_SECONDS / 60) }),
        });
        if (!sent) {
          // Lets a developer without SMTP finish the flow.
          console.warn(`[email-otp] email not sent. Code for ${email}: ${otp}`);
        }
      },
    }),
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
            emailVerified: rawUser?.emailVerified ?? true,
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
              emailVerified: freshUser?.emailVerified ?? fallback.emailVerified,
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
