import {Route, Routes} from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Control from './pages/Control.jsx'
import Dieta from './pages/Dieta.jsx'
import Entrenamiento from './pages/Entrenamiento.jsx'
import Politica from './pages/Politica.jsx'
import NotFound from './pages/NotFound.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Perfil from './pages/Perfil.jsx'
import NuevaClave from './pages/NuevaClave.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'
import AdminUsuarios from './pages/AdminUsuarios.jsx'

export default function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/login" element={<Login/>}/>

                <Route path="/auth/callback" element={<AuthCallback/>}/>
                <Route
                    path="/control"
                    element={
                        <RequireAuth>
                            <Control/>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/dieta"
                    element={
                        <RequireAuth>
                                <Dieta/>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/entrenamiento"
                    element={
                        <RequireAuth>
                                <Entrenamiento/>
                        </RequireAuth>
                    }
                />
                <Route
                    path="/perfil"
                    element={
                        <RequireAuth>
                            <Perfil />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/admin"
                    element={
                         <RequireAdmin>
                              <AdminUsuarios />
                         </RequireAdmin>
                    }
                />
                <Route path="/nueva-clave" element={<NuevaClave />} />
                <Route path="/politica" element={<Politica/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </Layout>
    )
}

