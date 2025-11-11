# Semana de la Ingeniería 2025

Aplicación web para el congreso académico de la Facultad de Ingeniería Tampico de la UAT.

## 🚀 Tecnologías

- **Framework**: Next.js 15.3.3 (React 18)
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Authentication + Firestore)
- **TypeScript**: Para type-safety completo
- **Form Management**: React Hook Form + Zod
- **AI**: Genkit (Google Generative AI)

## 📋 Requisitos Previos

- Node.js 20.x o superior
- npm o pnpm
- Cuenta de Firebase con proyecto configurado

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/imomarmorales/studio.git
   cd studio
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno** (opcional)
   ```bash
   cp .env.example .env.local
   ```
   
   Las credenciales de Firebase están configuradas en `src/firebase/config.ts`.
   Para desarrollo local con emuladores, descomenta en `.env.local`:
   ```
   NEXT_PUBLIC_EMULATOR_HOST=localhost
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```
   
   La aplicación estará disponible en `http://localhost:9002`

## 🔥 Configuración de Firebase

### Proyecto Firebase
- **Project ID**: `studio-496281858-a9fee`
- Configuración en: `src/firebase/config.ts`

### Firestore Database

#### Colecciones:
- **users**: Perfiles de participantes y administradores
- **events**: Eventos del congreso
- **users/{userId}/attendance**: Asistencia a eventos por usuario

#### Reglas de Seguridad:
Las reglas están definidas en `firestore.rules`:
- Los usuarios pueden crear y leer su propio perfil
- Solo admins pueden listar todos los usuarios
- Eventos son visibles para usuarios autenticados
- Solo admins pueden crear/editar/eliminar eventos
- Usuarios pueden registrar su propia asistencia

Para desplegar las reglas:
```bash
firebase deploy --only firestore:rules
```

### Authentication

#### Métodos habilitados:
- Email/Password

#### Usuarios Admin:
Para crear un usuario administrador:
1. Usar el email exacto: `admin@congreso.mx`
2. El sistema automáticamente asigna rol `admin`
3. Redirige a `/admin/events`

#### Usuarios Estudiantes:
- Deben usar email `@alumnos.uat.edu.mx`
- Se asigna rol `alumno`
- Acceso a dashboard de usuario

## 📁 Estructura del Proyecto

```
src/
├── app/                      # Next.js App Router
│   ├── (admin)/             # Rutas de administrador
│   │   └── events/          # Gestión de eventos
│   ├── (app)/               # Rutas de aplicación de usuario
│   │   ├── agenda/
│   │   ├── dashboard/
│   │   ├── perfil/
│   │   └── ranking/
│   ├── login/               # Autenticación
│   └── registro/            # Registro (redirige a login)
├── components/              # Componentes React
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Layouts y navegación
│   ├── events/              # Componentes de eventos
│   └── shared/              # Componentes compartidos
├── firebase/                # Configuración e integración Firebase
│   ├── auth/                # Hooks de autenticación
│   ├── firestore/           # Hooks de Firestore
│   ├── config.ts            # Credenciales Firebase
│   ├── index.ts             # Inicialización
│   ├── provider.tsx         # React Context Provider
│   └── errors.ts            # Manejo de errores
├── hooks/                   # Custom React hooks
├── lib/                     # Utilidades y tipos
│   ├── types.ts             # Definiciones TypeScript
│   ├── utils.ts             # Funciones auxiliares
│   └── placeholder-images.ts
└── ai/                      # Configuración Genkit AI
```

## 🎯 Características Principales

### Para Administradores (`/admin/events`)
- ✅ Crear, editar y eliminar eventos
- ✅ Generar códigos QR para eventos
- ✅ Ver lista completa de eventos
- ✅ Gestión de imágenes de eventos

### Para Usuarios (`/app/*`)
- ✅ Dashboard personalizado
- ✅ Visualizar agenda de eventos
- ✅ Escanear QR para registrar asistencia
- ✅ Sistema de puntos y ranking
- ✅ Credencial digital con QR
- ✅ Perfil de usuario editable

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo (puerto 9002)

# Producción
npm run build            # Construye para producción
npm run start            # Inicia servidor de producción

# Calidad de código
npm run lint             # Ejecuta ESLint
npm run typecheck        # Verifica tipos TypeScript

# AI/Genkit
npm run genkit:dev       # Inicia Genkit en modo desarrollo
npm run genkit:watch     # Inicia Genkit con watch mode
```

## 🚀 Deployment

### Firebase App Hosting

El proyecto usa Firebase App Hosting (configurado en `apphosting.yaml`):

```bash
# Deploy completo (requiere permisos de owner)
firebase deploy

# Deploy solo de reglas de Firestore
firebase deploy --only firestore:rules
```

### Proceso de Deploy
1. Hacer push a la rama `main` en GitHub
2. Firebase Studio detecta cambios automáticamente
3. Click en "Publish" en Firebase Studio
4. El deploy se ejecuta automáticamente

## 👥 Roles y Permisos

### Admin
- Email: `admin@congreso.mx`
- Acceso completo a gestión de eventos
- Puede ver todos los usuarios
- Acceso a panel de administración

### Alumno
- Email: `@alumnos.uat.edu.mx`
- Acceso a funciones de usuario
- Dashboard personalizado
- Registro de asistencia a eventos

## 🐛 Troubleshooting

### Error: Firebase no inicializado
- Verificar que `FirebaseClientProvider` esté en el layout
- Revisar configuración en `src/firebase/config.ts`

### Error: Permisos de Firestore denegados
- Verificar que las reglas estén desplegadas
- Confirmar que el usuario esté autenticado
- Para admins, verificar campo `role: 'admin'` en Firestore

### Error de build
```bash
# Limpiar caché y reinstalar
rm -rf .next node_modules
npm install
npm run build
```

## 📝 Notas de Desarrollo

- Puerto de desarrollo: **9002**
- Firebase emulators: Auth (9099), Firestore (8080)
- TypeScript strict mode habilitado
- ESLint configurado para Next.js

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Proyecto académico - Facultad de Ingeniería Tampico, UAT © 2025

## 📧 Contacto

Para soporte o preguntas sobre el proyecto, contactar al equipo de desarrollo.

---

**Última actualización**: Noviembre 2025
