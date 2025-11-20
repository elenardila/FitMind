import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { generarRutinaGemini, generarDietaGemini } from '../lib/geminiClient'
import { guardarPlan } from '../lib/planesService'
import {
    FiSave,
    FiUpload,
    FiTrash2,
    FiAlertCircle,
    FiCheckCircle,
} from 'react-icons/fi'

function formatearMarcaTiempo() {
    const ahora = new Date()
    const dd = String(ahora.getDate()).padStart(2, '0')
    const mm = String(ahora.getMonth() + 1).padStart(2, '0')
    const aa = String(ahora.getFullYear()).slice(-2)
    const hh = String(ahora.getHours()).padStart(2, '0')
    const min = String(ahora.getMinutes()).padStart(2, '0')
    const ss = String(ahora.getSeconds()).padStart(2, '0')
    return `${dd}/${mm}/${aa}, ${hh}:${min}:${ss}`
}

export default function Perfil() {
    const { perfil, updatePerfil, uploadAvatar, session } = useAuth()
    const userId = session?.user?.id

    const [form, setForm] = useState({
        nombre: perfil?.nombre || '',
        edad: perfil?.edad ?? '',
        sexo: perfil?.sexo || 'no_especificado',
        altura_cm: perfil?.altura_cm ?? '',
        peso_kg: perfil?.peso_kg ?? '',
        nivel_actividad: perfil?.nivel_actividad || 'medio',
        objetivo: perfil?.objetivo || 'mantener',
        preferencias: perfil?.preferencias || { vegetariano: false, sin_gluten: false },
        alergias: perfil?.alergias || [],
    })

    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [avatarSaving, setAvatarSaving] = useState(false)

    // 🔄 cuando cambie "perfil" desde el contexto, rehidratamos el formulario
    useEffect(() => {
        if (!perfil) return
        setForm({
            nombre: perfil.nombre || '',
            edad: perfil.edad ?? '',
            sexo: perfil.sexo || 'no_especificado',
            altura_cm: perfil.altura_cm ?? '',
            peso_kg: perfil.peso_kg ?? '',
            nivel_actividad: perfil.nivel_actividad || 'medio',
            objetivo: perfil.objetivo || 'mantener',
            preferencias: perfil.preferencias || { vegetariano: false, sin_gluten: false },
            alergias: perfil.alergias || [],
        })
    }, [perfil])

    // ⏱️ Autocierre de notificaciones (mensaje / error)
    useEffect(() => {
        if (!mensaje && !error) return
        const t = setTimeout(() => {
            setMensaje('')
            setError('')
        }, 4000) // 4 segundos
        return () => clearTimeout(t)
    }, [mensaje, error])

    const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }))

    const onPrefChange = (k, v) =>
        setForm((f) => ({
            ...f,
            preferencias: { ...(f.preferencias || {}), [k]: v },
        }))

    const onAlergiasChange = (txt) =>
        onChange(
            'alergias',
            txt
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
        )

    // 💡 Regenerar entrenamiento + dieta tras actualizar perfil
    const regenerarPlanesDesdePerfil = async (perfilParaIA) => {
        const marcaTiempo = formatearMarcaTiempo()

        // 🏋️ Entrenamiento
        try {
            const rutina = await generarRutinaGemini(perfilParaIA)
            if (Array.isArray(rutina) && rutina.length > 0 && userId) {
                const datosPlanEntrenamiento = {
                    nombre: `Entrenamiento ${marcaTiempo}`,
                    dias: rutina,
                }
                await guardarPlan(userId, 'entrenamiento', datosPlanEntrenamiento)
            } else {
                console.warn('[Perfil] Rutina generada no válida, se omite guardar entrenamiento.')
            }
        } catch (err) {
            console.error('[Perfil] Error al regenerar entrenamiento desde perfil:', err)
            throw new Error(
                'Perfil actualizado, pero hubo un problema al regenerar el entrenamiento.'
            )
        }

        // 🍽️ Dieta
        try {
            const dieta = await generarDietaGemini(perfilParaIA)
            if (Array.isArray(dieta) && dieta.length > 0 && userId) {
                const datosPlanDieta = {
                    nombre: `Dieta ${marcaTiempo}`,
                    dias: dieta,
                }
                await guardarPlan(userId, 'dieta', datosPlanDieta)
            } else {
                console.warn('[Perfil] Dieta generada no válida, se omite guardar dieta.')
            }
        } catch (err) {
            console.error('[Perfil] Error al regenerar dieta desde perfil:', err)
            throw new Error('Perfil actualizado, pero hubo un problema al regenerar la dieta.')
        }
    }

    const handleGuardar = async (e) => {
        e.preventDefault()
        setMensaje('')
        setError('')

        if (!userId) {
            setError('Debes iniciar sesión para guardar tu perfil.')
            return
        }

        setSaving(true)
        try {
            // Normalizamos los datos que vamos a guardar
            const payload = {
                nombre: form.nombre || null,
                edad: form.edad ? Number(form.edad) : null,
                sexo: form.sexo || 'no_especificado',
                altura_cm: form.altura_cm ? Number(form.altura_cm) : null,
                peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
                nivel_actividad: form.nivel_actividad || 'medio',
                objetivo: form.objetivo || 'mantener',
                preferencias: form.preferencias || {},
                alergias: form.alergias?.length ? form.alergias : null,
            }

            // 1️⃣ Actualizamos perfil en Supabase
            await updatePerfil(payload)

            // Construimos un objeto perfil coherente para la IA
            const perfilParaIA = {
                ...(perfil || {}),
                ...payload,
            }

            // 2️⃣ Regeneramos entrenamiento + dieta con el nuevo perfil
            await regenerarPlanesDesdePerfil(perfilParaIA)

            setMensaje('Perfil actualizado y planes regenerados correctamente ✅')
        } catch (err) {
            console.error('[Perfil] Error en guardar perfil/regenerar planes:', err)
            setError(err.message || 'No se pudo guardar el perfil o regenerar los planes.')
        } finally {
            setSaving(false)
        }
    }

    const handleAvatar = async (e) => {
        const input = e.target
        const file = input.files?.[0]
        if (!file) return

        setMensaje('')
        setError('')
        setAvatarSaving(true)

        try {
            await uploadAvatar(file)
            setMensaje('Avatar actualizado.')
        } catch (err) {
            console.error('[Perfil] Error al subir avatar:', err)
            setError(err.message || 'No se pudo subir el avatar.')
        } finally {
            // 🧽 Muy importante: limpiar el input para que al elegir el MISMO archivo
            // vuelva a disparar onChange (si no, después de borrar parece que "no hace nada")
            input.value = ''
            setAvatarSaving(false)
        }
    }

    const handleEliminarAvatar = async () => {
        setMensaje('')
        setError('')
        setAvatarSaving(true)
        try {
            await updatePerfil({ avatar_url: null })
            setMensaje('Avatar eliminado. Se usará el avatar por defecto.')
        } catch (err) {
            console.error('[Perfil] Error al eliminar avatar:', err)
            setError(err.message || 'No se pudo eliminar el avatar.')
        } finally {
            setAvatarSaving(false)
        }
    }

    const avatarSrc = perfil?.avatar_url
        ? perfil.avatar_url
        : 'https://ui-avatars.com/api/?name=' +
        encodeURIComponent(perfil?.nombre || 'Usuario') +
        '&background=8c52ff&color=fff'

    return (
        <section className="section">
            <div className="container max-w-3xl">
                <h1 className="section-title">Tu perfil</h1>
                <p className="mt-2 text-text-muted dark:text-white/80">
                    Edita tus datos y preferencias. Al guardar, se regenerarán tu dieta y entrenamiento.
                </p>

                {/* Toast / notificaciones */}
                {(mensaje || error) && (
                    <div className="mt-4 flex justify-end">
                        <div
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm shadow-lg border ${
                                mensaje
                                    ? 'bg-emerald-900/80 border-emerald-500 text-emerald-50'
                                    : 'bg-red-900/80 border-red-500 text-red-50'
                            }`}
                        >
                            {mensaje ? (
                                <FiCheckCircle className="shrink-0" />
                            ) : (
                                <FiAlertCircle className="shrink-0" />
                            )}
                            <p>{mensaje || error}</p>
                        </div>
                    </div>
                )}

                <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr] items-start">
                    {/* Avatar */}
                    <div className="card card-pad text-center">
                        <img
                            src={avatarSrc}
                            alt="Avatar"
                            className="mx-auto h-28 w-28 rounded-full object-cover border border-black/10 dark:border-white/10"
                        />
                        <div className="mt-4 flex flex-col gap-2 items-center">
                            <label className="btn-ghost inline-flex items-center gap-2 cursor-pointer text-sm">
                                <FiUpload className="text-base" />
                                {avatarSaving ? 'Subiendo…' : 'Cambiar avatar'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatar}
                                    disabled={avatarSaving}
                                />
                            </label>
                            {perfil?.avatar_url && (
                                <button
                                    type="button"
                                    className="btn-ghost inline-flex items-center gap-2 text-xs text-red-400"
                                    onClick={handleEliminarAvatar}
                                    disabled={avatarSaving}
                                >
                                    <FiTrash2 className="text-sm" />
                                    Eliminar avatar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleGuardar} className="card card-pad space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-1">Nombre</label>
                                <input
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                                    value={form.nombre}
                                    onChange={(e) => onChange('nombre', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Edad</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                                    value={form.edad}
                                    onChange={(e) => onChange('edad', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Sexo</label>
                                <select
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white"
                                    value={form.sexo}
                                    onChange={(e) => onChange('sexo', e.target.value)}
                                >
                                    <option value="no_especificado">No especificado</option>
                                    <option value="mujer">Mujer</option>
                                    <option value="hombre">Hombre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Altura (cm)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                                    value={form.altura_cm}
                                    onChange={(e) => onChange('altura_cm', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Peso (kg)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                                    value={form.peso_kg}
                                    onChange={(e) => onChange('peso_kg', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Nivel de actividad</label>
                                <select
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white"
                                    value={form.nivel_actividad}
                                    onChange={(e) => onChange('nivel_actividad', e.target.value)}
                                >
                                    <option value="sedentario">Sedentario</option>
                                    <option value="ligero">Ligero</option>
                                    <option value="medio">Medio</option>
                                    <option value="alto">Alto</option>
                                    <option value="atleta">Atleta</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Objetivo</label>
                                <select
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white"
                                    value={form.objetivo}
                                    onChange={(e) => onChange('objetivo', e.target.value)}
                                >
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
                                        <input
                                            type="checkbox"
                                            checked={!!form.preferencias?.vegetariano}
                                            onChange={(e) => onPrefChange('vegetariano', e.target.checked)}
                                        />
                                        Vegetariano
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={!!form.preferencias?.sin_gluten}
                                            onChange={(e) => onPrefChange('sin_gluten', e.target.checked)}
                                        />
                                        Sin gluten
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Alergias (coma separadas)</label>
                                <input
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                                    value={form.alergias?.join(', ') || ''}
                                    onChange={(e) => onAlergiasChange(e.target.value)}
                                />
                            </div>
                        </div>

                        <button disabled={saving} className="btn-primary inline-flex items-center gap-2">
                            <FiSave className="text-base" />
                            {saving ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    )
}
