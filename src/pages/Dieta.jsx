export default function Dieta() {
    // Datos de muestra (cambia por tu backend)
    const semana = [
        { dia: 'Lun', kcal: 2100, comidas: ['Desayuno: Avena y fruta', 'Comida: Pollo + quinoa', 'Cena: Tortilla y ensalada'] },
        { dia: 'Mar', kcal: 2050, comidas: ['Desayuno: Yogur + granola', 'Comida: Lentejas', 'Cena: Salmón al horno'] },
        { dia: 'Mié', kcal: 2080, comidas: ['Desayuno: Tostadas + aguacate', 'Comida: Arroz + pavo', 'Cena: Crema de calabaza'] },
        { dia: 'Jue', kcal: 2120, comidas: ['Desayuno: Batido proteico', 'Comida: Pasta integral', 'Cena: Wok de verduras'] },
        { dia: 'Vie', kcal: 2000, comidas: ['Desayuno: Avena + cacao', 'Comida: Garbanzos', 'Cena: Huevo + verduras'] },
        { dia: 'Sáb', kcal: 2200, comidas: ['Desayuno: Tortitas', 'Comida: Paella mixta', 'Cena: Ensalada completa'] },
        { dia: 'Dom', kcal: 2150, comidas: ['Desayuno: Tostadas francesas', 'Comida: Pollo asado', 'Cena: Crema + yogur'] }
    ]

    const kcalTot = semana.reduce((acc, d) => acc + d.kcal, 0)

    return (
        <section className="section">
            <div className="container">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="section-title">Plan de dieta (semana)</h1>
                        <p className="mt-2 text-text-muted dark:text-white/80">
                            Menús variados y balanceados. Ajusta raciones según hambre/actividad.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="btn-ghost">Regenerar</button>
                        <button className="btn-primary">Descargar PDF</button>
                    </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {semana.map((d, i) => (
                        <article key={i} className="card card-pad">
                            <header className="flex items-center justify-between">
                                <h2 className="font-semibold text-lg text-brand">{d.dia}</h2>
                                <span className="text-sm text-text-muted dark:text-white/70">{d.kcal} kcal</span>
                            </header>
                            <ul className="mt-4 space-y-2 text-sm">
                                {d.comidas.map((c, j) => <li key={j} className="list-disc ml-5">{c}</li>)}
                            </ul>
                        </article>
                    ))}
                </div>

                <div className="mt-8 card card-pad">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-text-muted dark:text-white/70">Calorías totales aprox.</p>
                        <p className="text-lg font-semibold">{kcalTot} kcal / semana</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
