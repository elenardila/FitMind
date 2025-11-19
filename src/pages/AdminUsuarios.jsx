import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { HiRefresh } from 'react-icons/hi' // ⬅️ ICONO GUAY

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

  // --- ESTADOS ---
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroSexo, setFiltroSexo] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [alturaMin, setAlturaMin] = useState('')
  const [alturaMax, setAlturaMax] = useState('')
  const [pesoMin, setPesoMin] = useState('')
  const [pesoMax, setPesoMax] = useState('')
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [actualizandoId, setActualizandoId] = useState(null)

  // --- RESET DE FILTROS ---
  const resetFilters = () => {
    setBusqueda('')
    setFiltroEstado('todos')
    setFiltroSexo('todos')
    setFechaDesde('')
    setFechaHasta('')
    setAlturaMin('')
    setAlturaMax('')
    setPesoMin('')
    setPesoMax('')
  }

  // --- INPUT BASE ---
  const inputBase =
    'w-full rounded-md border-slate-300 bg-white text-slate-900 ' +
    'dark:bg-white/5 dark:border-white/20 dark:text-white px-3 py-2 text-sm'

  // --- CARGAR USUARIOS ---
  useEffect(() => {
    let cancelado = false

    async function cargar() {
      setCargando(true)
      setError(null)

      try {
        let query = supabase
          .from('perfiles')
          .select(`
            id,
            email,
            nombre,
            es_admin,
            activo,
            creado_en,
            sexo,
            altura_cm,
            peso_kg
          `)
          // NO admins
          .eq('es_admin', false)
          .order('creado_en', { ascending: false })

        if (busqueda.trim() !== '') {
          const t = busqueda.trim()
          query = query.or(`email.ilike.%${t}%,nombre.ilike.%${t}%`)
        }

        if (filtroEstado === 'activos') query = query.eq('activo', true)
        if (filtroEstado === 'bloqueados') query = query.eq('activo', false)

        if (filtroSexo !== 'todos') query = query.eq('sexo', filtroSexo)

        if (fechaDesde) query = query.gte('creado_en', fechaDesde)
        if (fechaHasta) query = query.lte('creado_en', fechaHasta + 'T23:59:59')

        const altMin = alturaMin ? parseFloat(alturaMin) : null
        const altMax = alturaMax ? parseFloat(alturaMax) : null
        const pesMin = pesoMin ? parseFloat(pesoMin) : null
        const pesMax = pesoMax ? parseFloat(pesoMax) : null

        if (altMin != null) query = query.gte('altura_cm', altMin)
        if (altMax != null) query = query.lte('altura_cm', altMax)
        if (pesMin != null) query = query.gte('peso_kg', pesMin)
        if (pesMax != null) query = query.lte('peso_kg', pesMax)

        const { data, error } = await query

        if (error) {
          console.error(error)
          if (!cancelado) setError('Error cargando usuarios')
          return
        }

        if (!cancelado) setUsuarios(data || [])
      } catch (e) {
        console.error(e)
        if (!cancelado) setError('Error inesperado')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    const t = setTimeout(() => cargar(), 300)
    return () => {
      cancelado = true
      clearTimeout(t)
    }
  }, [busqueda, filtroEstado, filtroSexo, fechaDesde, fechaHasta, alturaMin, alturaMax, pesoMin, pesoMax])

  // --- ACTIVAR / BLOQUEAR ---
  const alternarEstado = async (u) => {
    if (perfil?.id === u.id) {
      alert('No puedes bloquear tu propia cuenta.')
      return
    }

    const nuevo = !u.activo
    setActualizandoId(u.id)

    try {
      const { data, error } = await supabase
        .from('perfiles')
        .update({ activo: nuevo })
        .eq('id', u.id)
        .select()
        .single()

      if (error) throw error

      setUsuarios((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, activo: data.activo } : x))
      )
    } catch (e) {
      console.error(e)
      setError('No se pudo actualizar el usuario.')
    } finally {
      setActualizandoId(null)
    }
  }

  const total = usuarios.length
  const activos = usuarios.filter((x) => x.activo).length
  const bloqueados = total - activos

  return (
    <section className="section">
      <div className="container space-y-6">
        <header>
          <h1 className="section-title text-brand">Panel de administración</h1>
          <p className="text-sm text-text-muted">
            Gestión de usuarios: filtros avanzados y bloqueo de cuentas.
          </p>
        </header>

        {/* --- FILTROS --- */}
        <div className="card card-pad space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* BUSCADOR */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
                Buscar
              </label>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar email o nombre"
                className={inputBase}
              />
            </div>

            {/* ESTADO */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className={inputBase}
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="bloqueados">Bloqueados</option>
              </select>
            </div>

            {/* SEXO */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
                Sexo
              </label>
              <select
                value={filtroSexo}
                onChange={(e) => setFiltroSexo(e.target.value)}
                className={inputBase}
              >
                <option value="todos">Todos</option>
                <option value="mujer">Mujer</option>
                <option value="hombre">Hombre</option>
                <option value="no_especificado">No especificado</option>
              </select>
            </div>
          </div>

          {/* FECHAS / ALTURA / PESO */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                Fecha desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className={inputBase}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                Fecha hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className={inputBase}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                  Altura mín.
                </label>
                <input
                  type="number"
                  value={alturaMin}
                  onChange={(e) => setAlturaMin(e.target.value)}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                  Altura máx.
                </label>
                <input
                  type="number"
                  value={alturaMax}
                  onChange={(e) => setAlturaMax(e.target.value)}
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                Peso mín.
              </label>
              <input
                type="number"
                value={pesoMin}
                onChange={(e) => setPesoMin(e.target.value)}
                className={inputBase}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                Peso máx.
              </label>
              <input
                type="number"
                value={pesoMax}
                onChange={(e) => setPesoMax(e.target.value)}
                className={inputBase}
              />
            </div>
          </div>

          {/* CONTADORES */}
          <div className="flex flex-wrap gap-4 text-xs text-text-muted">
            <span>Total: {total}</span>
            <span>Activos: {activos}</span>
            <span>Bloqueados: {bloqueados}</span>
          </div>

          {/* --- BOTÓN RESET --- */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 btn-ghost border border-slate-300 dark:border-white/20 px-4 py-2 rounded-md text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              <HiRefresh className="h-4 w-4" />
              Resetear filtros
            </button>
          </div>
        </div>

        {/* --- TABLA DE USUARIOS --- */}
        <div className="card card-pad">
          {error && (
            <div className="mb-3 rounded-md bg-red-50 text-red-800 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-text-muted">
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Sexo</th>
                  <th className="px-3 py-2">Altura</th>
                  <th className="px-3 py-2">Peso</th>
                  <th className="px-3 py-2">Creado</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-text-muted">
                      Cargando…
                    </td>
                  </tr>
                )}

                {!cargando && usuarios.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-text-muted">
                      Sin resultados
                    </td>
                  </tr>
                )}

                {!cargando &&
                  usuarios.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 dark:border-white/10">
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2">{u.nombre || '—'}</td>
                      <td className="px-3 py-2">{u.sexo || '—'}</td>
                      <td className="px-3 py-2">{u.altura_cm || '—'}</td>
                      <td className="px-3 py-2">{u.peso_kg || '—'}</td>
                      <td className="px-3 py-2">
                        {u.creado_en ? new Date(u.creado_en).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <BadgeEstado activo={u.activo} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          disabled={actualizandoId === u.id}
                          onClick={() => alternarEstado(u)}
                          className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-semibold ${
                            u.activo
                              ? 'btn-ghost text-red-700 hover:bg-red-50'
                              : 'btn-primary'
                          }`}
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
