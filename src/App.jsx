import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Control from './pages/Control.jsx'
import Dieta from './pages/Dieta.jsx'
import Entrenamiento from './pages/Entrenamiento.jsx'
import Politica from './pages/Politica.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/control" element={<Control />} />
                <Route path="/dieta" element={<Dieta />} />
                <Route path="/entrenamiento" element={<Entrenamiento />} />
                <Route path="/politica" element={<Politica />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Layout>
    )
}

