import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Hook providing access to the local (email+password) auth session.
 * Complementary to the OAuth session in useAuth().
 *
 * - `localUser`:   the decoded safe user object (no passwordHash), or null
 * - `isLocalAuth`: true when a valid local session cookie is present
 * - `isLoading`:   true while the initial `me` query is in flight
 * - `logout`:      clears the local session cookie and redirects to /login
 */
export function useLocalAuth() {
    const [, navigate] = useLocation();

    const meQuery = trpc.localAuth.me.useQuery(undefined, {
        retry: false,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });

    const utils = trpc.useUtils();

    const logoutMut = trpc.localAuth.logout.useMutation({
        onSuccess: () => {
            utils.localAuth.me.invalidate();
            navigate("/login");
        },
        onError: () => {
            // Force client-side logout even if server request fails
            utils.localAuth.me.invalidate();
            navigate("/login");
        },
    });

    return {
        localUser: meQuery.data ?? null,
        isLocalAuth: !!meQuery.data,
        isLoading: meQuery.isLoading,
        logout: () => logoutMut.mutate(),
    };
}
