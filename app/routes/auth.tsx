import React from 'react'
export const meta = () => (
    [
        {title: 'Resumind | Auth'},
        {name: 'description', content: 'Log into your account'}
    ]
)

const Auth = () => {
    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className="gradient-border shadow-lg">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                    <div>
                        <h1>Weloccome</h1>
                        <h2>Login in to continue your Job journey</h2>
                    </div>
                </section>

            </div>
        </main>
    )
}
export default Auth
