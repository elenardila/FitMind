import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
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
    const {
        perfil,
        updatePerfil,
        uploadAvatar,
        session,
        loading,
        desactivarCuenta,
    } = useAuth()
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

    // Zona peligrosa
    const [modalEliminarOpen, setModalEliminarOpen] = useState(false)
    const [eliminando, setEliminando] = useState(false)

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
        }, 4000)
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

            // 👇 AuthContext.updatePerfil ya se encarga de regenerar dieta + entrenamiento
            await updatePerfil(payload)

            const marca = formatearMarcaTiempo()
            setMensaje(`Perfil actualizado correctamente (${marca}) ✅`)
        } catch (err) {
            console.error('[Perfil] Error en guardar perfil:', err)
            setError(err.message || 'No se pudo guardar el perfil.')
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

    if (loading) {
        return (
            <section className="section">
                <div className="container max-w-3xl">
                    <p>Cargando perfil…</p>
                </div>
            </section>
        )
    }

    if (!perfil) {
        return (
            <section className="section">
                <div className="container max-w-3xl">
                    <p>No se ha encontrado tu perfil.</p>
                </div>
            </section>
        )
    }

    return (
        <section className="section">
            <div className="container max-w-3xl">
                <h1 className="section-title">Tu perfil</h1>
                <p className="mt-2 text-text-muted dark:text-white/80">
                    Edita tus datos y preferencias. Al guardar, se regenerarán tu dieta y tu entrenamiento.
                </p>

                {/* Toast / notificaciones flotantes */}
                {(mensaje || error) && (
                    <div className="fixed bottom-4 right-4 z-50 flex justify-end px-4 pointer-events-none">
                        <div
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm shadow-lg border pointer-events-auto
                ${
                                mensaje
                                    ? 'bg-brand/90 border-brand text-white'
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

                {/* ================================
            ZONA PELIGROSA: ELIMINAR CUENTA
           ================================ */}
                <div className="mt-10 card card-pad border border-red-500/40 bg-red-500/5">
                    <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                        Eliminar mi cuenta
                    </h2>
                    <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                        En FitMind nos tomamos muy en serio tu privacidad. Al eliminar tu cuenta,
                        todos tus datos personales, preferencias, historial y cualquier otra
                        información asociada serán eliminados de forma permanente e irreversible.
                        Esta acción no se puede deshacer.
                    </p>

                    <button
                        type="button"
                        onClick={() => setModalEliminarOpen(true)}
                        className="mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium
                       bg-red-600 hover:bg-red-700 text-white shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Eliminar mi cuenta
                    </button>
                </div>

                {/* MODAL confirmación eliminación */}
                <Modal
                    open={modalEliminarOpen}
                    onClose={() => (eliminando ? null : setModalEliminarOpen(false))}
                    title="¿Eliminar tu cuenta?"
                    actions={
                        <>
                            <button
                                type="button"
                                className="btn-ghost"
                                disabled={eliminando}
                                onClick={() => setModalEliminarOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-primary bg-red-600 hover:bg-red-700 border-red-700"
                                disabled={eliminando}
                                onClick={async () => {
                                    setMensaje('')
                                    setError('')
                                    try {
                                        setEliminando(true)
                                        await desactivarCuenta()
                                        // 👉 El AuthContext hará logout al ver activo = false.
                                        // No usamos alert, mantenemos el mismo estilo visual.
                                    } catch (e) {
                                        console.error('[Perfil] Error al desactivar cuenta:', e)
                                        setError(
                                            e?.message || 'No se pudo eliminar la cuenta. Inténtalo más tarde.'
                                        )
                                        setEliminando(false)
                                    }
                                }}
                            >
                                {eliminando ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
                            </button>
                        </>
                    }
                >
                    <p className="text-sm">
                        Tras realizar esta acción se cerrará tu sesión automáticamente y no podrás
                        volver a acceder con este usuario.
                    </p>
                    <p className="mt-2 text-sm">
                        ¿Seguro que quieres continuar?
                    </p>
                </Modal>
            </div>
        </section>
    )
}
