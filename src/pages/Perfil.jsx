// src/pages/Perfil.jsx
import {useState} from 'react'
import {useAuth} from '../context/AuthContext'

export default function Perfil() {
    const {perfil, updatePerfil, uploadAvatar} = useAuth()
    const [form, setForm] = useState({
        nombre: perfil?.nombre || '',
        edad: perfil?.edad || '',
        sexo: perfil?.sexo || 'no_especificado',
        altura_cm: perfil?.altura_cm || '',
        peso_kg: perfil?.peso_kg || '',
        nivel_actividad: perfil?.nivel_actividad || 'medio',
        objetivo: perfil?.objetivo || 'mantener',
        preferencias: perfil?.preferencias || {vegetariano: false, sin_gluten: false},
        alergias: perfil?.alergias || []
    })
    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const onChange = (k, v) => setForm(f => ({...f, [k]: v}))
    const onPrefChange = (k, v) => setForm(f => ({...f, preferencias: {...(f.preferencias || {}), [k]: v}}))
    const onAlergiasChange = (txt) => onChange('alergias', txt.split(',').map(s => s.trim()).filter(Boolean))

    const handleGuardar = async (e) => {
        e.preventDefault()
        setMensaje('');
        setError('');
        setSaving(true)
        try {
            await updatePerfil({
                nombre: form.nombre || null,
                edad: form.edad ? Number(form.edad) : null,
                sexo: form.sexo || 'no_especificado',
                altura_cm: form.altura_cm ? Number(form.altura_cm) : null,
                peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
                nivel_actividad: form.nivel_actividad || 'medio',
                objetivo: form.objetivo || 'mantener',
                preferencias: form.preferencias || {},
                alergias: form.alergias?.length ? form.alergias : null
            })
            setMensaje('Perfil actualizado correctamente.')
        } catch (err) {
            setError(err.message || 'No se pudo guardar el perfil.')
        } finally {
            setSaving(false)
        }
    }

    const handleAvatar = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setMensaje('');
        setError('')
        try {
            await uploadAvatar(file)
            setMensaje('Avatar actualizado.')
        } catch (err) {
            setError(err.message || 'No se pudo subir el avatar.')
        }
    }

    const avatarSrc = perfil?.avatar_url
        ? perfil.avatar_url
        : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(perfil?.nombre || 'Usuario') + '&background=8c52ff&color=fff'

    return (
        <section className="section">
            <div className="container max-w-3xl">
                <h1 className="section-title">Tu perfil</h1>
                <p className="mt-2 text-text-muted dark:text-white/80">Edita tus datos y preferencias.</p>

                <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr] items-start">
                    {/* Avatar */}
                    <div className="card card-pad text-center">
                        <img src={avatarSrc} alt="Avatar"
                             className="mx-auto h-28 w-28 rounded-full object-cover border border-black/10 dark:border-white/10"/>
                        <label className="btn-ghost mt-4 inline-block cursor-pointer">
                            Cambiar avatar
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar}/>
                        </label>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleGuardar} className="card card-pad space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-1">Nombre</label>
                                <input
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                                    value={form.nombre} onChange={(e) => onChange('nombre', e.target.value)}/>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Edad</label>
                                <input type="number" min="0"
                                       className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                                       value={form.edad} onChange={(e) => onChange('edad', e.target.value)}/>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Sexo</label>
                                <select className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white"
                                        value={form.sexo} onChange={(e) => onChange('sexo', e.target.value)}>
                                    <option value="no_especificado">No especificado</option>
                                    <option value="mujer">Mujer</option>
                                    <option value="hombre">Hombre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Altura (cm)</label>
                                <input type="number" step="0.01"
                                       className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                                       value={form.altura_cm} onChange={(e) => onChange('altura_cm', e.target.value)}/>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Peso (kg)</label>
                                <input type="number" step="0.01"
                                       className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                                       value={form.peso_kg} onChange={(e) => onChange('peso_kg', e.target.value)}/>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Nivel de actividad</label>
                                <select className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white"
                                        value={form.nivel_actividad}
                                        onChange={(e) => onChange('nivel_actividad', e.target.value)}>
                                    <option value="sedentario">Sedentario</option>
                                    <option value="ligero">Ligero</option>
                                    <option value="medio">Medio</option>
                                    <option value="alto">Alto</option>
                                    <option value="atleta">Atleta</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Objetivo</label>
                                <select className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white"
                                        value={form.objetivo} onChange={(e) => onChange('objetivo', e.target.value)}>
                                    <option value="perder">Perder peso</option>
                                    <option value="mantener">Mantener</option>
                                    <option value="ganar">Ganar masa</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-1">Preferencias</label>
                                <div className="flex flex-col gap-2 text-sm">
                                    <label className="inline-flex items-center gap-2">
                                        <input type="checkbox" checked={!!form.preferencias?.vegetariano}
                                               onChange={(e) => onPrefChange('vegetariano', e.target.checked)}/>
                                        Vegetariano
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                        <input type="checkbox" checked={!!form.preferencias?.sin_gluten}
                                               onChange={(e) => onPrefChange('sin_gluten', e.target.checked)}/>
                                        Sin gluten
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Alergias (coma separadas)</label>
                                <input
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                                    value={form.alergias?.join(', ') || ''}
                                    onChange={(e) => onAlergiasChange(e.target.value)}/>
                            </div>
                        </div>

                        {mensaje && <p className="text-sm text-emerald-600 dark:text-emerald-400">{mensaje}</p>}
                        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                        <button disabled={saving}
                                className="btn-primary">{saving ? 'Guardando…' : 'Guardar cambios'}</button>
                    </form>
                </div>
            </div>
        </section>
    )
}
