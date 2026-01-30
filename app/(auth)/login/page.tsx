import { LoginForm } from "@/components/app/login/login-form";
import { authCookie, verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const token = (await cookies()).get(authCookie.name)?.value;

    if (token) {
        let isValid = false;

        try {
            await verifyAuthToken(token);
            isValid = true;
        } catch {
            isValid = false;
        }

        if (isValid) {
            redirect("/dashboard");
        }
    }

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-4xl">
                <LoginForm />
            </div>
        </div>
    );
}
