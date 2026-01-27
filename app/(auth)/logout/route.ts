import { authCookie } from "@/lib/auth";
import { NextResponse } from "next/server";

export function GET(req: Request) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set(authCookie.name, "", { path: "/", maxAge: 0 });
    return res;
}