import { NextRequest, NextResponse } from "next/server";
import { authCookie, verifyAuthToken } from "./lib/auth";

export async function proxy(request: NextRequest) {
    const token = request.cookies.get(authCookie.name)?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        await verifyAuthToken(token);
        return NextResponse.next();
    } catch {
        const res = NextResponse.redirect(new URL("/login", request.url));

        res.cookies.set(authCookie.name, "", { path: "/", maxAge: 0 });
        return res;
    }
}

export const config = {
    matcher: [
        "/dashboard",
        "/dashboard/:path",
        "/users",
        "/users/:path",
        "/clients",
        "/clients/:path",
        "/config",
        "/config/:path",
        "/appointments",
        "/appointments/:path",
        "/inventory",
        "/inventory/:path",
        "/work-orders",
        "/work-orders/:path",
    ]
};