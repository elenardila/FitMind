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
import RequireSubscription from './components/RequireSubscription.jsx'

export default function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/login" element={<Login/>}/>

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
                            <RequireSubscription>
                                <Dieta/>
                            </RequireSubscription>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/entrenamiento"
                    element={
                        <RequireAuth>
                            <RequireSubscription>
                                <Entrenamiento/>
                            </RequireSubscription>
                        </RequireAuth>
                    }
                />

                <Route path="/politica" element={<Politica/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </Layout>
    )
}

