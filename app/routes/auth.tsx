import React, {useEffect} from 'react'
import {usePuterStore} from "~/lib/puter";
import {useLocation, useNavigate} from "react-router";
export const meta = () => (
    [
        {title: 'Resumind | Auth'},
        {name: 'description', content: 'Log into your account'}
    ]
)

// Authentication to the next page
const Auth = () => {
    const { isLoading, error, clearError, puterReady, auth } = usePuterStore();
    const location = useLocation();
    const nextParam = new URLSearchParams(location.search).get("next");
    const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";
    const navigate = useNavigate();

    useEffect(() => {
        if(auth.isAuthenticated) navigate(next, { replace: true });
    }, [auth.isAuthenticated, navigate, next]);

    const handleSignIn = async () => {
        clearError();
        await auth.signIn();
        await auth.checkAuthStatus();
    };

    const handleSignOut = async () => {
        clearError();
        await auth.signOut();
    };

    return (
        <main className="app-bg min-h-screen flex items-center justify-center px-4">
            <div className="gradient-border shadow-lg">
                <section className="flex flex-col gap-8 surface-card rounded-2xl p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>Welcome</h1>
                        <h2>Log in to continue your job journey</h2>
                    </div>
                    {!puterReady && (
                        <p className="text-amber-600 text-center font-medium">
                            Loading Puter SDK...
                        </p>
                    )}
                    {error && (
                        <p className="text-red-600 text-center font-medium break-words">
                            {error}
                        </p>
                    )}
                    <div>
                        {isLoading ? (
                            <button className="auth-button" disabled>
                                <p>Signing you in...</p>
                            </button>
                        ) : (
                            <>
                                {auth.isAuthenticated ? (
                                    <button className="auth-button" onClick={handleSignOut}>
                                        <p>Log out</p>
                                    </button>
                                ): (
                                    <button className="auth-button" onClick={handleSignIn}>
                                        <p>Log in</p>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </section>

            </div>
        </main>
    )
}
export default Auth
