
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

## 🚀 Despliegue

[![Despliegue en Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://fitmind-six.vercel.app/)

Accede a la versión en producción: https://fitmind-six.vercel.app/


![Previsualización de la app](public/img/preview.png)

---

## 🧱 Estructura del proyecto

```bash

fitmind/
│
├── public/               # Recursos estáticos (imágenes, logos…)
│
├── docs/                 # Documentación (manual de usuario y manual técnico)
│
├── src/
│   ├── components/       # Layout, Modal, etc.
│   ├── pages/            # Home, Login, Control, Dieta, Entrenamiento, Política, 404
│   ├── lib/              # Cliente Supabase y cliente Gemini
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
| perfiles | Datos del usuario \(nombre, avatar, rol, etc.\)      |
| medidas  | Progreso semanal \(peso, grasa, kcal\)                      |
| planes   | Planes de entrenamiento y dieta \(JSON por semana\)         |

Políticas RLS:
- Cada usuario solo accede a sus propios datos.
- Los administradores pueden gestionar suscripciones y usuarios.

---

## 👤 Roles de usuario

| Rol        | Permisos                                                |
|------------|---------------------------------------------------------|
| Usuario    | Ver landing page para registrarse                       |
| Registrado | Acceso completo a rutinas, dietas y control de progreso |
| Admin      | Gestionar suscripciones y perfiles de otros usuarios    |

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
- ✅ Componentes reutilizables \(Navbar, Modal, RequireAdmin, RequireAuth\)
- ✅ Estilo responsive con modo oscuro
- ✅ Supabase con RLS y roles
- ✅ Sistema de autenticación y rol de administrador
- ✅ Generación automática de planes personalizados por IA

---

| Vista            | Descripción                             |
|------------------|-----------------------------------------|
| 🏠 Inicio        | Presentación y CTA principal             |
| 🔐 Login / Registro | Acceso y autenticación de usuario    |
| 📊 Dashboard | Seguimiento de progreso y medidas        |
| 🍎 Plan de dieta | Visualización del menú semanal           |
| 🏋️ Entrenamiento | Rutinas personalizadas                  |
| ⚙️ Administración | Gestión de usuarios y suscripciones     |

---

## 🧑‍🏫 Tutorías

- Tutor: Francisco José Mera Calderón

### Resumen de las tutorías

Se mantuvo una reunión semanal, siguiendo un plan estructurado para el desarrollo del TFG.

1. Semana 1 — 07/10/2025
   - Inicio y planificación: definición de alcance, objetivos y criterios de evaluación.
2. Semana 2 — 14/10/2025
   - Elección de stack y estructura básica del proyecto (React \+ Vite, Tailwind, Supabase).
3. Semana 3 — 21/10/2025
   - Modelado de datos en Supabase: tablas `perfiles`, `medidas`, `planes` y políticas RLS.
4. Semana 4 — 28/10/2025
   - Implementación de vistas principales: Landing, Control, Dieta, Entrenamiento.
5. Semana 5 — 04/11/2025
   - Diseño y componentes UI: Navbar, Footer, cards y botones reutilizables; responsive y modo oscuro.
6. Semana 6 — 11/11/2025
  - Autenticación y gestión de sesiones con Supabase Auth; pruebas iniciales de login.
7. Semana 7 — 18/11/2025
   - Integración de lógica de planes y suscripciones; roles (`admin`, `usuario`).
8. Semana 8 — 24/11/2025
   - Pruebas, corrección de bugs y ajustes en políticas RLS; revisión de sesiones persistentes.
9. Semana 9 — 29/11/2025
   - Documentación final: consolidación del manual técnico y de usuario; preparación para entrega y defensa.

### Notas del seguimiento
- Cada sesión siguió la estructura: resumen de avances, demo funcional, bloqueo/riesgos y tareas para la siguiente semana.

---

## 👩‍💻 Autoría

- Elena Ardila Delgado
- CFGS en Desarrollo de Aplicaciones Web \(DAW\)
- 📍 IES Albarregas – Mérida \(España\)
- 📘 Proyecto TFG: FitMind AI – Entrenador y nutricionista inteligente \(2025\)

---

## 🏷️ Licencia

Distribuido bajo licencia MIT.
