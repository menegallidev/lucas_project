import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "auth_token";

function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET não definida");
    return new TextEncoder().encode(secret);
}

export type AuthPayload = {
    sub: string;
    name?: string;
}

export async function signAuthToken(payload: AuthPayload) {
    const secret = getSecret();

    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(secret);
}

export async function verifyAuthToken(token: string) {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload;
}

export const authCookie = {
    name: COOKIE_NAME,
    options: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
    },
};