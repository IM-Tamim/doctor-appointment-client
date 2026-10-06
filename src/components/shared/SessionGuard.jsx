"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const PRIVATE_ROUTES = ["/dashboard", "/doctors/", "/payment/"];
const PUBLIC_ROUTES = ["/payment/result"];

const SessionGuard = () => {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isPending) return;
        const isPrivate = PRIVATE_ROUTES.some((route) => pathname.startsWith(route)) && !PUBLIC_ROUTES.includes(pathname);
        if (isPrivate && !session) {
            router.replace("/signin");
        }
    }, [session, isPending, pathname]);

    return null;
};

export default SessionGuard;