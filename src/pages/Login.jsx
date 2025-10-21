export default function Login() {
    return (
        <section className="section">
            <div className="container max-w-md">
                <h1 className="section-title text-brand mb-6">Acceder</h1>
                <form className="card card-pad space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Email</label>
                        <input type="email" className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Contraseña</label>
                        <input type="password" className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10" />
                    </div>
                    <button className="btn-primary w-full">Entrar</button>
                </form>
            </div>
        </section>
    )
}
