export default function Politica() {
    return (
        <section className="section">
            <div className="container max-w-3xl">
                <h1 className="section-title">Política de privacidad</h1>
                <p className="mt-2 text-sm text-text-muted dark:text-white/80">
                    Última actualización: {new Date().toLocaleDateString('es-ES')}
                </p>

                <article className="mt-8 card card-pad space-y-6 text-sm leading-relaxed">
                    {/* 1. Responsable */}
                    <section>
                        <h2 className="font-semibold text-lg">1. Responsable del tratamiento</h2>
                        <p className="mt-2">
                            El responsable del tratamiento de los datos es <strong>FitMind</strong>, aplicación
                            orientada a la generación de planes personalizados de entrenamiento y nutrición
                            mediante IA.
                        </p>
                        <p className="mt-2">
                            Puedes contactar con nosotros en:{' '}
                            <a
                                href="mailto:hola@fitmind.local"
                                className="underline hover:text-brand"
                            >
                                hola@fitmind.local
                            </a>
                            .
                        </p>
                    </section>

                    {/* 2. Datos que tratamos */}
                    <section>
                        <h2 className="font-semibold text-lg">2. Datos que tratamos</h2>
                        <p className="mt-2">
                            En FitMind tratamos exclusivamente los datos necesarios para poder prestarte el servicio:
                        </p>
                        <ul className="mt-2 list-disc ml-5 space-y-1.5">
                            <li>
                                <span className="font-medium">Datos de cuenta:</span> correo electrónico y
                                contraseña (almacenada en formato cifrado/hash).
                            </li>
                            <li>
                                <span className="font-medium">Datos de perfil:</span> edad, sexo, altura,
                                peso, nivel de actividad física y objetivo principal (perder peso, ganar masa muscular,
                                mantener, etc.).
                            </li>
                            <li>
                                <span className="font-medium">Preferencias y uso de la app:</span> tipo de entrenamiento
                                preferido, disponibilidad semanal, histórico de planes generados.
                            </li>
                            <li>
                                <span className="font-medium">Datos opcionales de salud y hábitos:</span> alergias
                                o intolerancias alimentarias, preferencias nutricionales (por ejemplo, vegetariano),
                                otra información que tú decidas proporcionar para afinar los planes.
                            </li>
                        </ul>
                        <p className="mt-2 text-xs text-text-muted dark:text-white/60">
                            No solicitamos ni tratamos datos especialmente sensibles más allá de los que tú decidas
                            introducir voluntariamente en tu perfil.
                        </p>
                    </section>

                    {/* 3. Finalidad y base legal */}
                    <section>
                        <h2 className="font-semibold text-lg">3. Finalidad y base legal</h2>
                        <p className="mt-2">
                            Utilizamos tus datos para las siguientes finalidades:
                        </p>
                        <ul className="mt-2 list-disc ml-5 space-y-1.5">
                            <li>
                                <span className="font-medium">Prestación del servicio:</span> generar y mostrar
                                planes personalizados de entrenamiento y dieta adaptados a tu perfil.
                            </li>
                            <li>
                                <span className="font-medium">Mejora del producto:</span> analizar de forma agregada
                                el uso de la aplicación para mejorar la experiencia y las recomendaciones.
                            </li>
                            <li>
                                <span className="font-medium">Gestión de la cuenta:</span> mantener tu perfil,
                                permitir el acceso seguro, y gestionar tus preferencias.
                            </li>
                        </ul>
                        <p className="mt-2">
                            La base legal principal para el tratamiento es la{' '}
                            <strong>ejecución del servicio</strong> que solicitas al registrarte y utilizar FitMind,
                            así como el <strong>consentimiento</strong> que prestas al completar y actualizar tu perfil.
                        </p>
                    </section>

                    {/* 4. Conservación */}
                    <section>
                        <h2 className="font-semibold text-lg">4. Plazo de conservación de los datos</h2>
                        <p className="mt-2">
                            Tus datos se conservarán mientras mantengas tu cuenta activa en FitMind.
                            Si solicitas la eliminación de tu cuenta, eliminaremos o anonimizaremos tus datos
                            dentro de un plazo razonable, salvo que exista una obligación legal de conservarlos
                            durante más tiempo.
                        </p>
                    </section>

                    {/* 5. Destinatarios y proveedores */}
                    <section>
                        <h2 className="font-semibold text-lg">5. Destinatarios y proveedores de servicios</h2>
                        <p className="mt-2">
                            No vendemos tus datos personales a terceros. Sin embargo, para poder prestar el servicio
                            utilizamos proveedores tecnológicos (por ejemplo, servicios de alojamiento, bases de datos
                            o herramientas de autenticación) que pueden tratar tus datos siguiendo nuestras instrucciones
                            y con las debidas garantías de seguridad.
                        </p>
                        <p className="mt-2 text-xs text-text-muted dark:text-white/60">
                            En ningún caso se cederán tus datos a terceros para fines comerciales propios de esos
                            terceros.
                        </p>
                    </section>

                    {/* 6. Seguridad */}
                    <section>
                        <h2 className="font-semibold text-lg">6. Medidas de seguridad</h2>
                        <p className="mt-2">
                            Aplicamos medidas técnicas y organizativas razonables para proteger tus datos personales
                            frente a accesos no autorizados, pérdida o uso indebido, como el uso de conexiones seguras,
                            cifrado de contraseñas y control de accesos internos.
                        </p>
                    </section>

                    {/* 7. Derechos de la persona usuaria */}
                    <section>
                        <h2 className="font-semibold text-lg">7. Tus derechos sobre los datos</h2>
                        <p className="mt-2">
                            Puedes ejercer en cualquier momento los derechos de{' '}
                            <strong>acceso, rectificación, supresión, oposición, limitación</strong> del tratamiento
                            y <strong>portabilidad</strong> de tus datos.
                        </p>
                        <p className="mt-2">
                            Para ello, puedes escribirnos a{' '}
                            <a
                                className="underline hover:text-brand"
                                href="mailto:hola@fitmind.local"
                            >
                                hola@fitmind.local
                            </a>{' '}
                            indicando el derecho que deseas ejercer y el correo con el que estás registrado en FitMind.
                        </p>
                        <p className="mt-2 text-xs text-text-muted dark:text-white/60">
                            Si consideras que se ha hecho un uso inadecuado de tus datos, también puedes presentar una
                            reclamación ante la autoridad de control de protección de datos que corresponda.
                        </p>
                    </section>

                    {/* 8. Cambios en esta política */}
                    <section>
                        <h2 className="font-semibold text-lg">8. Cambios en la política de privacidad</h2>
                        <p className="mt-2">
                            Podemos actualizar esta política de privacidad para reflejar cambios en la aplicación
                            o en la normativa aplicable. Cuando eso ocurra, actualizaremos la fecha de la última
                            revisión en la parte superior de esta página. Recomendamos revisar esta sección de
                            vez en cuando.
                        </p>
                    </section>
                </article>
            </div>
        </section>
    )
}
