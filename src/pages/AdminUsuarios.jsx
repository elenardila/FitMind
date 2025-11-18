import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

function BadgeEstado({ activo }) {
  const base =
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold'
  return activo ? (
    <span className={`${base} bg-green-100 text-green-800`}>
      ● Activo
    </span>
  ) : (
    <span className={`${base} bg-red-100 text-red-800`}>
      ● Bloqueado
    </span>
  )
}

function BadgeRol({ esAdmin }) {
  const base =
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold'
  return esAdmin ? (
    <span className={`${base} bg-purple-100 text-purple-800`}>
      Admin
    </span>
  ) : (
    <span className={`${base} bg-slate-100 text-slate-800`}>
      Usuario
    </span>
  )
}

export default function AdminUsuarios() {
  const { perfil } = useAuth()

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos') // todos | activos | bloqueados
  const [filtroRol, setFiltroRol] = useState('todos') // todos | admin | usuario

  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [actualizandoId, setActualizandoId] = useState(null)

  // 🔍 Cargar usuarios con buscador + filtros (modo “AJAX”)
  useEffect(() => {
    let cancelado = false

    async function cargarUsuarios() {
      setCargando(true)
      setError(null)

      try {
        let query = supabase
          .from('perfiles')
          .select('id, email, nombre, es_admin, activo, creado_en')
          // ⬇️ NO queremos que el admin aparezca en la lista
          .neq('email', 'admin@plexus.es')
          .order('creado_en', { ascending: true })

        if (busqueda.trim() !== '') {
          const texto = busqueda.trim()
          query = query.or(`email.ilike.%${texto}%,nombre.ilike.%${texto}%`)
        }

        if (filtroEstado === 'activos') {
          query = query.eq('activo', true)
        } else if (filtroEstado === 'bloqueados') {
          query = query.eq('activo', false)
        }

        if (filtroRol === 'admin') {
          query = query.eq('es_admin', true)
        } else if (filtroRol === 'usuario') {
          query = query.eq('es_admin', false)
        }

        const { data, error } = await query

        if (error) {
          console.error('[AdminUsuarios] Error al cargar usuarios:', error)
          if (!cancelado) setError('No se han podido cargar los usuarios.')
          return
        }

        if (!cancelado) {
          setUsuarios(data ?? [])
        }
      } catch (e) {
        console.error('[AdminUsuarios] Excepción al cargar usuarios:', e)
        if (!cancelado) setError('Error inesperado al cargar usuarios.')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    const timeoutId = setTimeout(() => {
      cargarUsuarios()
    }, 300)

    return () => {
      cancelado = true
      clearTimeout(timeoutId)
    }
  }, [busqueda, filtroEstado, filtroRol])

  // 🔁 Activar / desactivar usuario
  const alternarEstadoUsuario = async (usuario) => {
    // Por si algún día no filtramos al admin: no permitir bloquearse a sí mismo
    if (perfil?.id === usuario.id) {
      alert('No puedes bloquear tu propia cuenta de administrador.')
      return
    }

    const nuevoEstado = !usuario.activo
    setActualizandoId(usuario.id)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('perfiles')
        .update({ activo: nuevoEstado })
        .eq('id', usuario.id)
        .select('id, activo')
        .single()

      if (error) {
        console.error('[AdminUsuarios] Error al actualizar estado:', error)
        setError('No se ha podido actualizar el estado del usuario.')
        return
      }

      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, activo: data.activo } : u))
      )
    } catch (e) {
      console.error('[AdminUsuarios] Excepción al actualizar estado:', e)
      setError('Error inesperado al actualizar el usuario.')
    } finally {
      setActualizandoId(null)
    }
  }

  const totalUsuarios = usuarios.length
  const totalActivos = usuarios.filter((u) => u.activo).length
  const totalBloqueados = totalUsuarios - totalActivos

  return (
    <section className="section">
      <div className="container space-y-6">
        <header className="space-y-1">
          <h1 className="section-title text-brand">Panel de administración</h1>
          <p className="text-sm text-text-muted">
            Gestiona los usuarios de FitMind: buscador, filtros y bloqueo de cuentas.
          </p>
        </header>

        {/* Filtros y buscador */}
        <div className="card card-pad space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
                Buscar usuario
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por email o nombre..."
                className="w-full rounded-md border-slate-300 bg-white text-slate-900 dark:bg-white/5 dark:border-white/20 dark:text-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full rounded-md border-slate-300 bg-white text-slate-900 dark:bg.white/5 dark:border.white/20 dark:text-white px-3 py-2 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="activos">Solo activos</option>
                <option value="bloqueados">Solo bloqueados</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
                Rol
              </label>
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="w-full rounded-md border-slate-300 bg-white text-slate-900 dark:bg.white/5 dark:border.white/20 dark:text-white px-3 py-2 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="admin">Solo admins</option>
                <option value="usuario">Solo usuarios</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-text-muted">
            <span>Total: {totalUsuarios}</span>
            <span>Activos: {totalActivos}</span>
            <span>Bloqueados: {totalBloqueados}</span>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="card card-pad">
          {error && (
            <div className="mb-3 rounded-md bg-red-50 text-red-800 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-text-muted border-b border-slate-200 dark:border-white/10">
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-text-muted">
                      Cargando usuarios…
                    </td>
                  </tr>
                )}

                {!cargando && usuarios.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-text-muted">
                      No se han encontrado usuarios con esos criterios.
                    </td>
                  </tr>
                )}

                {!cargando &&
                  usuarios.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 dark:border-white/5 last:border-0"
                    >
                      <td className="px-3 py-3 align-middle">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {u.email}
                        </div>
                        <div className="text-xs text-text-muted">
                          {u.creado_en
                            ? new Date(u.creado_en).toLocaleDateString()
                            : '—'}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        {u.nombre || (
                          <span className="text-text-muted">Sin nombre</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <BadgeRol esAdmin={u.es_admin} />
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <BadgeEstado activo={u.activo} />
                      </td>
                      <td className="px-3 py-3 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => alternarEstadoUsuario(u)}
                          disabled={actualizandoId === u.id}
                          className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-semibold ${
                            u.activo
                              ? 'btn-ghost text-red-700 hover:bg-red-50'
                              : 'btn-primary'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          {actualizandoId === u.id
                            ? 'Guardando…'
                            : u.activo
                            ? 'Bloquear'
                            : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
