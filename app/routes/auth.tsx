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
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const next = location.search.split('next')[1];
    const navigate = useNavigate();

    useEffect(() => {
        if(auth.isAuthenticated) navigate(next);
    }, [auth.isAuthenticated, next]);


    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className="gradient-border shadow-lg">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>Weloccome</h1>
                        <h2>Login in to continue your Job journey</h2>
                    </div>
                    <div>
                        {isLoading ? (
                            <button className="auth-button animate-pulse">
                                <p>Signing you in...</p>
                            </button>
                        ) : (
                            <>
                                {auth.isAuthenticated ? (
                                    <button className="auth-button animate-pulse" onClick={auth.signOut}>
                                        <p>Log out</p>
                                    </button>
                                ): (
                                    <button className="auth-button animate-pulse" onClick={auth.signIn}>
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
