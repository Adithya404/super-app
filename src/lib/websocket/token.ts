import { jwtVerify, SignJWT } from "jose";

const WS_TOKEN_AUDIENCE = "pingpal-ws";
const WS_TOKEN_EXPIRY = "5m";
const WS_TOKEN_ISSUER = "super-app";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createWsToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(WS_TOKEN_EXPIRY)
    .setAudience(WS_TOKEN_AUDIENCE)
    .setIssuer(WS_TOKEN_ISSUER)
    .sign(getSecret());
}

export async function verifyWsToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      audience: WS_TOKEN_AUDIENCE,
      issuer: WS_TOKEN_ISSUER,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export const WS_TOKEN_TTL_SECONDS = 5 * 60;
