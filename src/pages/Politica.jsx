export default function Politica() {
    return (
        <section className="section">
            <div className="container max-w-3xl">
                <h1 className="section-title">Política de privacidad</h1>
                <p className="mt-2 text-text-muted dark:text-white/80">
                    Última actualización: {new Date().toLocaleDateString('es-ES')}
                </p>

                <article className="mt-8 card card-pad space-y-6 text-sm leading-relaxed">
                    <section>
                        <h2 className="font-semibold text-lg">1. Responsable</h2>
                        <p className="mt-2">
                            FitMind procesa tus datos con el objetivo de prestar el servicio de planes
                            personalizados de entrenamiento y nutrición.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold text-lg">2. Datos que tratamos</h2>
                        <ul className="mt-2 list-disc ml-5">
                            <li>Cuenta: email y contraseña (hash).</li>
                            <li>Preferencias: objetivos, nivel, disponibilidad.</li>
                            <li>Datos opcionales: medidas, hábitos, alergias/intolerancias.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-semibold text-lg">3. Finalidad y base legal</h2>
                        <p className="mt-2">
                            Prestar el servicio contratado, mejorar recomendaciones y cumplir obligaciones legales.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold text-lg">4. Conservación</h2>
                        <p className="mt-2">
                            Mientras tengas cuenta activa o sea necesario para cumplir con obligaciones legales.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold text-lg">5. Derechos</h2>
                        <p className="mt-2">
                            Acceso, rectificación, supresión, oposición, limitación y portabilidad. Escríbenos a
                            <a className="ml-1 underline hover:text-brand" href="mailto:hola@fitmind.local">hola@fitmind.local</a>.
                        </p>
                    </section>
                </article>
            </div>
        </section>
    )
}
