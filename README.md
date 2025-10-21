
# 💪 FitMind AI — Tu entrenador y nutricionista inteligente

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-blue?logo=react" alt="React Badge">
  <img src="https://img.shields.io/badge/Backend-Supabase-green?logo=supabase" alt="Supabase Badge">
  <img src="https://img.shields.io/badge/Estilos-TailwindCSS-38bdf8?logo=tailwindcss" alt="Tailwind Badge">
  <img src="https://img.shields.io/badge/Licencia-MIT-yellow" alt="License Badge">
</p>

> 🧠 FitMind AI es una aplicación web final del ciclo Desarrollo de Aplicaciones Web.
> Permite a cada usuario entrenar, alimentarse y progresar con planes personalizados generados mediante IA.

---

## 🌍 Descripción general

FitMind combina una arquitectura moderna y modular:
- 🔹 Frontend: React + Vite + TailwindCSS
- 🔹 Base de datos y autenticación: Supabase \(PostgreSQL + Auth + Storage\)
- 🔹 Gestión de usuarios: login, roles \(`admin`, `usuario`\), suscripción y perfil
- 🔹 Diseño: limpio, oscuro, responsive y con componentes reutilizables
- 🔹 Objetivo: gestionar plan de entrenamiento y dieta semanal

---

## 🧱 Estructura del proyecto

```bash

fitmind/
│
├── public/               # Recursos estáticos (imágenes, logos…)
│
├── src/
│   ├── components/       # Layout, Navbar, Footer, etc.
│   ├── pages/            # Home, Login, Control, Dieta, Entrenamiento, Política, 404
│   ├── lib/              # Cliente Supabase
│   ├── context/          # Contexto de Autenticación (AuthContext)
│   ├── App.jsx           # Enrutamiento principal
│   ├── main.jsx          # Entrada React
│   └── index.css         # Estilos globales Tailwind
│
├── .env.local            # Variables locales (NO se sube)
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── README.md
└── .gitignore
```

---

## ⚙️ Instalación y ejecución local

### 1️⃣ Clonar el repositorio

```bash

git clone https://github.com/elenardila/fitmind.git
cd fitmind
```

### 2️⃣ Instalar dependencias

```bash

npm install
```

### 3️⃣ Ejecutar el entorno de desarrollo

```bash

npm run dev
```

El proyecto se abrirá en: http://localhost:5173

---

## 🗄️ Base de datos \(Supabase\)

Tablas principales:

| Tabla     | Descripción                                                 |
|----------|-------------------------------------------------------------|
| perfiles | Datos del usuario \(nombre, avatar, rol, suscripción\)      |
| medidas  | Progreso semanal \(peso, grasa, kcal\)                      |
| planes   | Planes de entrenamiento y dieta \(JSON por semana\)         |

Políticas RLS:
- Cada usuario solo accede a sus propios datos.
- Los administradores pueden gestionar suscripciones y usuarios.

---

## 👤 Roles de usuario

| Rol       | Permisos                                                |
|-----------|---------------------------------------------------------|
| Usuario   | Ver landing page para suscribirse                       |
| Suscrito  | Acceso completo a rutinas, dietas y control de progreso |
| Admin     | Gestionar suscripciones y perfiles de otros usuarios    |

---

## 🧠 Tecnologías principales

| Tecnología        | Uso                                             |
|-------------------|--------------------------------------------------|
| ⚛️ React + Vite   | Frontend moderno y rápido                       |
| 🎨 TailwindCSS    | Estilos consistentes, adaptables y modo oscuro  |
| 🧰 Supabase       | Backend con PostgreSQL, Auth y Storage          |
| 🧾 Markdown       | Documentación del proyecto                      |

---

## 💻 Comandos útiles

| Acción                     | Comando           |
|---------------------------|-------------------|
| Instalar dependencias     | `npm install`     |
| Ejecutar en desarrollo    | `npm run dev`     |
| Build de producción       | `npm run build`   |
| Previsualizar build       | `npm run preview` |

---

## 🧩 Características implementadas

- ✅ Vistas: inicio, login, control, dieta, entrenamiento, política, 404
- ✅ Navegación con React Router
- ✅ Componentes reutilizables \(Navbar, Footer, Card, Button\)
- ✅ Estilo responsive con modo claro y oscuro
- ✅ Supabase con RLS y roles
- ✅ Sistema de suscripción y rol de administrador
- 🚧 Próximamente: generación automática de planes personalizados por IA

---

## 📸 Capturas \(pendiente\)

Añade imágenes en `public/img/` y enlázalas aquí:

| Vista            | Descripción                             |
|------------------|-----------------------------------------|
| 🏠 Inicio        | Presentación y CTA principal             |
| 🔐 Login / Registro | Acceso y autenticación de usuario    |
| 📊 Panel control | Seguimiento de progreso y medidas        |
| 🍎 Plan de dieta | Visualización del menú semanal           |
| 🏋️ Entrenamiento | Rutinas personalizadas                  |
| ⚙️ Administración | Gestión de usuarios y suscripciones     |

---

## 👩‍💻 Autoría

- Elena Ardila Delgado
- Tutor: Francisco José Mera Calderón
- CFGS en Desarrollo de Aplicaciones Web \(DAW\)
- 📍 IES Albarregas – Mérida \(España\)
- 📘 Proyecto TFG: FitMind AI – Entrenador y nutricionista inteligente \(2025\)

---

## 🪄 Inspiración

> “El cuerpo logra lo que la mente cree. FitMind nace para demostrarlo.”  
> — Elena Ardila Delgado

---

## 🏷️ Licencia

Distribuido bajo licencia MIT.
