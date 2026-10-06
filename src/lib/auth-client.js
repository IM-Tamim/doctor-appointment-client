import { createAuthClient } from "better-auth/react";
import { jwtClient, emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [jwtClient(), emailOTPClient()],
});
