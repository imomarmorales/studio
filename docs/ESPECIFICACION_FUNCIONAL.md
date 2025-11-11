# Especificación Funcional y UX - Sistema de Eventos Semana de la Ingeniería

**Versión:** 1.0  
**Fecha:** 10 de noviembre de 2025  
**Responsable:** Product Owner + UX/UI Senior

---

## 1. VISIÓN Y OBJETIVOS

Sistema de gestión de eventos para la Semana de la Ingeniería que permite a usuarios asistir a eventos mediante escaneo de QR, acumular puntos, competir en rankings y obtener insignias. Los administradores gestionan eventos, usuarios y monitorean asistencias.

### Objetivos Clave
- **Experiencia sin fricción** para marcar asistencia (máximo 3 taps)
- **Engagement** mediante gamificación (puntos, ranking, insignias)
- **Control total** para administradores
- **Prevención de fraude** en registros de asistencia

---

## 2. ANÁLISIS DEL ESTADO ACTUAL

### ✅ Ya Implementado
1. **Autenticación**: Login/registro con email institucional (@alumnos.uat.edu.mx)
2. **Admin básico**: Crear eventos, ver usuarios, generar QR
3. **Agenda**: Lista de eventos con escáner QR básico
4. **Estructura Firestore**: Collections users, events, attendance
5. **Validación**: No duplicados de email, solo institucionales

### ❌ Falta Implementar (Crítico - CA)
1. **CA1**: Flujo completo de asistencia con confirmación visual/sonora
2. **CA2**: Notificaciones de eventos en curso + diferenciación visual
3. **CA3**: Ranking funcional (excluir 0 puntos, mostrar posición)
4. **CA4**: QR descargable/permanente por evento
5. **CA5**: Edición de usuarios y eventos por admin
6. **CA6**: Vista cronograma/itinerario visual
7. **CA7**: Sistema de diseño coherente con paleta roja
8. **CA8**: Documentación de reglas de negocio

### 🔧 Necesita Mejoras
- Dashboard actual vacío ("Contenido próximamente")
- Ranking con datos mock, no conectado a Firestore
- Perfil sin mostrar posición en ranking ni insignias
- Eventos sin puntos personalizados
- Sin sistema de notificaciones

---

## 3. SISTEMA DE DISEÑO Y PALETA

### Paleta de Colores (Basada en Rojo Institucional)

```css
/* Colores Primarios */
--primary: 0 72% 51%        /* #DC2626 - Rojo principal */
--primary-light: 0 72% 61%  /* #EF4444 - Hover/Active */
--primary-dark: 0 82% 41%   /* #B91C1C - Botones importantes */

/* Estados de Eventos */
--event-live: 0 100% 60%    /* #FF3333 - Evento EN CURSO (brillante) */
--event-upcoming: 210 40% 50% /* #5B8BB3 - Próximo */
--event-past: 0 0% 60%      /* #999999 - Pasado */

/* Semánticos */
--success: 142 71% 45%      /* #16A34A - Confirmaciones */
--warning: 38 92% 50%       /* #F97316 - Alertas */
--error: 0 84% 60%          /* #EF4444 - Errores */

/* Neutrales */
--background: 0 0% 100%     /* #FFFFFF */
--foreground: 240 10% 3.9%  /* #09090B - Texto principal */
--muted: 240 4.8% 95.9%     /* #F4F4F5 - Fondos secundarios */
--border: 240 5.9% 90%      /* #E4E4E7 - Bordes */
```

### Tipografía
- **Primaria**: Inter (sans-serif) - Legibilidad en pantallas
- **Pesos**: Regular 400, Medium 500, Semibold 600, Bold 700
- **Escala**:
  - H1: 36px/42px (mobile: 28px/34px)
  - H2: 30px/36px (mobile: 24px/30px)
  - H3: 24px/30px (mobile: 20px/26px)
  - Body: 16px/24px
  - Small: 14px/20px

### Accesibilidad (WCAG AA)
- Contraste mínimo texto/fondo: 4.5:1
- Contraste elementos interactivos: 3:1
- Estados focus visibles (outline 2px primary)
- Touch targets mínimo 44x44px
- Soporte modo oscuro (opcional fase 2)

---

## 4. ARQUITECTURA DE INFORMACIÓN

### Colecciones Firestore

```typescript
// users/{userId}
interface User {
  id: string;                    // UID de Firebase Auth
  name: string;
  email: string;
  photoURL?: string;
  points: number;                // Total acumulado
  role: 'admin' | 'alumno';
  badges: string[];              // IDs de insignias desbloqueadas
  createdAt: Timestamp;
  digitalCredentialQR: string;   // UID para credencial QR
}

// events/{eventId}
interface Event {
  id: string;
  title: string;
  description: string;
  dateTime: string;              // ISO 8601
  endDateTime?: string;          // Para duración
  location: string;
  imageUrl?: string;
  points: number;                // Puntos otorgados (default 100)
  qrCode: string;                // ID único para validación
  status: 'upcoming' | 'live' | 'past';  // Auto-calculado
  speakers?: string[];           // Ponentes
  maxCapacity?: number;          // Aforo máximo
  category?: string;             // Categorización
  createdBy: string;             // Admin UID
  createdAt: Timestamp;
}

// users/{userId}/attendance/{attendanceId}
interface Attendance {
  id: string;                    // Compuesto: {userId}_{eventId}
  eventId: string;
  eventTitle: string;            // Desnormalizado para historial
  pointsEarned: number;
  timestamp: Timestamp;
  scanLocation?: GeoPoint;       // Opcional: validación geográfica
  verified: boolean;             // Flag de validación
}

// badges (colección global)
interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  requirement: {
    type: 'attendance_count' | 'points_total' | 'special';
    value: number;
  };
  color: string;                 // Color hex del badge
}
```

---

## 5. FLUJOS DE USUARIO DETALLADOS

### 5.1 Pantalla Principal de Eventos (Usuario Autenticado)

**Ruta**: `/app/agenda`

**Layout**:
```
[Header con logo + nombre usuario + puntos]
[Filtros: Todos | En curso | Próximos | Pasados]
[Grid de tarjetas de eventos (2 col mobile, 3-4 desktop)]
```

**Tarjeta de Evento**:
- **Imagen**: 16:9 ratio, lazy loading, fallback placeholder
- **Badge de estado**: Esquina superior derecha
  - 🔴 "EN VIVO" (rojo brillante pulsante) para eventos en curso
  - 🟦 "PRÓXIMO" (azul) para futuros
  - ⚪ Sin badge para pasados (opacidad reducida)
- **Contenido**:
  - Título (truncate 2 líneas)
  - Fecha/hora (formato: "Lun 15 Nov • 10:00 AM")
  - Ubicación (icono pin + texto)
  - Puntos (icono trofeo + "100 pts")
- **Acción**: Tap en toda la tarjeta abre detalle

**Microinteracciones**:
- Hover: Elevación sutil (shadow-md → shadow-lg)
- Eventos EN VIVO: Borde animado pulsante (pulse animation)
- Loading: Skeleton cards con shimmer

---

### 5.2 Detalle de Evento

**Componente**: Modal/Sheet responsive (fullscreen mobile, dialog desktop)

**Contenido**:
1. **Header**:
   - Imagen full-width
   - Botón cerrar (X)
   - Badge de estado superpuesto

2. **Info Principal**:
   - Título (H2)
   - Fecha, hora, duración
   - Ubicación con mapa miniatura (opcional)
   - Puntos otorgados (destacado)

3. **Descripción Expandible**:
   - Texto completo (markdown support)
   - Ponentes (avatares + nombres)
   - Agenda interna (timeline)

4. **CTA Principal**:
   - Si evento EN CURSO: "Marcar Asistencia" (botón grande, rojo brillante)
   - Si próximo: "Recordarme" (secundario)
   - Si pasado: "Ya Finalizado" (deshabilitado)

5. **Info Secundaria**:
   - Asistentes actuales / Capacidad máxima
   - "Ya marcaste asistencia ✓" (si aplica)

**Decisión UX**: Modal en lugar de página completa para mantener contexto y reducir friction (menos navegación).

---

### 5.3 Marcar Asistencia (Flujo Crítico - CA1)

**Trigger**: Usuario toca "Marcar Asistencia" en detalle del evento

**Paso 1: Validaciones Previas**
```typescript
// Validar antes de abrir cámara
1. Usuario autenticado ✓
2. Evento está EN CURSO (dentro de ventana de tiempo)
3. Usuario NO ha marcado asistencia previa
4. Evento no ha alcanzado capacidad máxima
```

Si alguna validación falla → Toast informativo + prevenir acción

**Paso 2: Escáner QR**
- Abrir cámara en modal fullscreen
- Overlay con guías de alineación (rectángulo central)
- Instrucciones: "Escanea el código QR del evento"
- Botón "Cancelar" visible
- Auto-focus y detección automática

**Paso 3: Validación del QR**
```typescript
// Validar datos escaneados
1. QR corresponde al evento seleccionado ✓
2. QR no ha expirado (si tiene TTL)
3. QR no ha sido invalidado por admin
```

**Paso 4: Registro en Firestore** (Transacción atómica)
```typescript
await runTransaction(firestore, async (transaction) => {
  // 1. Verificar asistencia no existe
  const attendanceDoc = doc(firestore, `users/${uid}/attendance/${uid}_${eventId}`);
  const exists = await transaction.get(attendanceDoc);
  if (exists.exists()) throw new Error('duplicate');

  // 2. Registrar asistencia
  transaction.set(attendanceDoc, {
    eventId,
    eventTitle: event.title,
    pointsEarned: event.points,
    timestamp: serverTimestamp(),
    verified: true
  });

  // 3. Incrementar puntos de usuario
  const userDoc = doc(firestore, `users/${uid}`);
  transaction.update(userDoc, {
    points: increment(event.points)
  });

  // 4. Verificar y otorgar badges
  // (lógica de badges)
});
```

**Paso 5: Feedback Visual y Sonoro**
- ✅ **Visual**: Animación de confeti + checkmark grande
- 🔊 **Sonoro**: Tono de éxito (opcional, con toggle)
- **Toast**: "¡Asistencia registrada! +100 puntos"
- **Vibración**: Patrón corto (móviles)
- **Actualización**: Puntos del usuario actualizados en header

**Paso 6: Post-registro**
- Modal de confirmación con resumen:
  ```
  ✅ Asistencia Confirmada
  
  Evento: [Nombre]
  Puntos ganados: +100
  Total de puntos: 350
  
  [Ver mi ranking] [Continuar]
  ```

**Prevención de Fraude**:
- Un QR por evento (único, no reutilizable entre eventos)
- Timestamp de registro
- Validación de que usuario esté físicamente presente (opcional: geolocalización)
- Admin puede invalidar QR y regenerar si detecta abuso
- Log de intentos fallidos

---

### 5.4 Notificaciones de Eventos (CA2)

**Sistema de Detección de Eventos EN CURSO**

**Lógica de Estado**:
```typescript
function getEventStatus(event: Event): EventStatus {
  const now = new Date();
  const start = new Date(event.dateTime);
  const end = event.endDateTime ? new Date(event.endDateTime) : addHours(start, 2);
  
  if (now >= start && now <= end) return 'live';
  if (now < start) return 'upcoming';
  return 'past';
}
```

**Notificaciones In-App**:
1. **Al iniciar sesión**: Verificar eventos en curso
2. **Polling cada 5 min**: Detectar nuevos eventos que inician
3. **Toast persistente**: "🔴 ¡[Evento] ha comenzado! No te lo pierdas"
4. **Badge en menú**: Contador de eventos en curso

**Diferenciación Visual** (CA2):
- Tarjetas de eventos EN CURSO:
  - Borde rojo brillante (2px solid)
  - Fondo con gradiente sutil rojo
  - Animación de pulso en badge "EN VIVO"
  - Elevación máxima (siempre visible)
- Ordenamiento: Eventos EN CURSO primero

**Recordatorios Pre-evento** (Enhancement):
- 30 min antes: Toast "El evento [X] comienza en 30 minutos"
- 10 min antes: Toast "El evento [X] está por comenzar"
- Opción "No volver a recordar" por evento

---

### 5.5 Perfil de Usuario (CA3 parcial)

**Ruta**: `/app/perfil`

**Secciones**:

1. **Header del Perfil**:
   ```
   [Foto (editable)]  [Nombre]
                      [Email]
                      [Rol: Alumno]
   ```

2. **Estadísticas Principales** (Cards):
   ```
   [Ranking]           [Puntos]          [Asistencias]
   #7 de 142           350 pts           7 eventos
   [Posición]          [Total]           [Count]
   ```

3. **Insignias Desbloqueadas**:
   - Grid de badges (3-4 por fila)
   - Badge desbloqueado: Color completo
   - Badge bloqueado: Gris + candado + requisito
   - Tooltip con descripción al hover

4. **Historial de Asistencias**:
   - Lista cronológica inversa
   - Por entrada:
     ```
     [Icono evento] [Nombre del evento]
                    [Fecha • +100 pts]
     ```

5. **Edición de Perfil**:
   - Subir/cambiar foto (Cloudinary/Firebase Storage)
   - Editar nombre
   - Cambiar contraseña
   - Botón "Guardar Cambios"

**Cálculo de Posición en Ranking**:
```typescript
// Real-time query
const getUserRanking = async (userId: string) => {
  const user = await getDoc(doc(firestore, 'users', userId));
  const userPoints = user.data().points;
  
  // Count users with more points
  const q = query(
    collection(firestore, 'users'),
    where('points', '>', userPoints),
    where('role', '==', 'alumno')
  );
  const snapshot = await getDocs(q);
  const position = snapshot.size + 1;
  
  return position;
};
```

---

### 5.6 Ranking/Leaderboard Público (CA3)

**Ruta**: `/app/ranking`

**Reglas de Negocio**:
- Mostrar solo usuarios con `points > 0`
- Excluir admins del ranking
- Ordenar por puntos descendente
- En caso de empate: orden alfabético por nombre

**Layout**:

1. **Podio (Top 3)**:
   - Desktop: 2do | 1ro | 3ro (escala diferente)
   - Mobile: 1ro | 2do | 3ro (vertical u horizontal compacto)
   - Cada uno muestra:
     - Medallería visual (oro/plata/bronce)
     - Avatar grande
     - Nombre
     - Puntos con formato (1,234 pts)
     - Número de asistencias

2. **Tabla de Posiciones** (4to en adelante):
   ```
   | # | Avatar | Nombre       | Puntos | Asistencias |
   |---|--------|--------------|--------|-------------|
   | 4 | [IMG]  | Ana López    | 850    | 12          |
   | 5 | [IMG]  | Carlos Gómez | 720    | 9           |
   ```

3. **Mi Posición** (Fixed bottom bar):
   ```
   [Mi posición: #7] [350 pts] [7 asistencias] [Ver mi perfil →]
   ```
   - Sticky al hacer scroll
   - Highlight visual

**Microinteracciones**:
- Animación de entrada escalonada (reveal)
- Contador animado de puntos (count-up)
- Highlight de la propia posición si está visible

**Paginación/Virtualización**:
- Cargar inicial: Top 50
- Infinite scroll para más
- Búsqueda por nombre (opcional)

---

### 5.7 Vista Cronograma/Itinerario (CA6)

**Ruta**: `/app/cronograma`

**Concepto Visual**: Timeline vertical estilo Gantt simplificado

**Layout**:
```
[Selector de fecha: < Lun 15 Nov >]

07:00 ─────────────────────────────
      │
08:00 │ [Evento A]
      │ └─ Ubicación, Puntos
09:00 │
      │ [Evento B] ┐
10:00 │            │ (paralelos)
      │ [Evento C] ┘
11:00 ─────────────────────────────
...
21:00 ─────────────────────────────
```

**Reglas de Diseño**:

1. **Eje Temporal**:
   - Horas de 07:00 a 21:00 (configurable)
   - Marcadores cada hora
   - Línea actual del tiempo (si es hoy)

2. **Bloques de Eventos**:
   - Altura proporcional a duración
   - Ancho:
     - Un evento: 100% ancho
     - Dos eventos simultáneos: 48% cada uno (lado a lado)
     - Tres o más: Grid responsivo
   - Colores según estado (live/upcoming/past)

3. **Interactividad**:
   - Tap en evento: Abre detalle
   - Scroll suave a hora actual (botón "Ahora")
   - Zoom in/out (opcional)

4. **Información por Evento**:
   - Título
   - Hora inicio - fin
   - Ubicación (icono)
   - Badge de estado
   - Indicador de asistencia propia (✓)

**Decisión UX**: Priorizar legibilidad sobre densidad. Máximo 3 eventos paralelos visibles sin scroll horizontal.

**Responsive**:
- Desktop: Timeline vertical con sidebar de detalles
- Mobile: Timeline vertical full-width, detalle en modal

---

## 6. FUNCIONALIDADES DE ADMINISTRADOR

### 6.1 Gestión de Eventos (CA4, CA5)

**Ruta**: `/admin/events`

**Lista de Eventos**:
- Tabla con columnas: Imagen | Título | Fecha | Estado | Asistentes | Acciones
- Filtros: Estado, Rango de fechas
- Ordenar: Fecha, Asistentes, Título
- Búsqueda por título

**Crear Evento** (Modal/Página):

Formulario:
```typescript
{
  title: string (min 5 chars),
  description: string (markdown),
  dateTime: DateTime,
  endDateTime: DateTime (auto: +2h),
  location: string,
  speakers: string[] (opcional),
  maxCapacity: number (opcional),
  points: number (default: 100),
  category: select (Conferencia, Taller, Networking, etc),
  imageUrl: file upload
}
```

**Al crear evento**:
1. Validar datos
2. Generar `qrCode`: UUID único
3. Guardar en Firestore
4. **Generar QR descargable** (CA4):
   - QR Code conteniendo: `{eventId}_{qrCode}`
   - Formato: PNG de alta resolución (1024x1024)
   - Superposición con:
     - Logo del congreso
     - Nombre del evento
     - Fecha y hora
     - "Escanea para registrar asistencia"
   - Botones:
     - [Descargar PNG]
     - [Descargar PDF para impresión]
     - [Copiar link]

**Editar Evento**:
- Todos los campos editables
- Opción "Regenerar QR" (invalida el anterior)
- Opción "Invalidar QR actual" (previene escaneos)
- Confirmación de cambios que afectan asistencias

**Acciones Masivas**:
- Duplicar evento
- Eliminar (con confirmación)
- Exportar listado de asistentes (CSV)

---

### 6.2 Gestión de Usuarios (CA5)

**Ruta**: `/admin/usuarios`

**Lista de Usuarios** (Ya implementada parcialmente):
- Tabla con: # | Avatar | Nombre | Email | Puntos | Asistencias | Rol | Acciones
- Ordenar por: Puntos, Nombre, Fecha registro
- Filtros: Rol, Rango de puntos
- Búsqueda por nombre o email

**Editar Usuario** (Modal):
```typescript
{
  name: string (editable),
  email: string (no editable),
  points: number (ajuste manual con log),
  role: select (admin | alumno),
  badges: multiselect,
  status: select (active | suspended)
}
```

**Justificación UX**: Permitir a admin corregir nombres inapropiados o errores sin eliminarel usuario completo.

**Acciones**:
- Editar perfil
- Ver historial de asistencias
- Ajustar puntos (con motivo registrado)
- Suspender cuenta (deshabilita login)
- Eliminar (con confirmación doble)

**Vista de Asistencias por Usuario**:
- Lista de eventos asistidos
- Timestamp de cada asistencia
- Opción de invalidar asistencia (resta puntos)

---

### 6.3 Panel de Control Admin

**Ruta**: `/admin/dashboard`

**Métricas en Cards**:
1. Total de usuarios registrados
2. Total de eventos creados
3. Asistencias totales registradas
4. Evento con más asistencia
5. Usuarios más activos (top 5)

**Gráficos**:
- Asistencias por día (line chart)
- Eventos por categoría (pie chart)
- Distribución de puntos (histogram)

**Alertas**:
- Eventos próximos sin QR descargado
- Eventos con baja asistencia
- Usuarios con comportamiento sospechoso (muchos intentos fallidos)

---

## 7. SISTEMA DE INSIGNIAS (Enhancement)

**Tipos de Badges**:

1. **Por Asistencias**:
   - 🥉 "Explorador" - 5 eventos
   - 🥈 "Entusiasta" - 10 eventos
   - 🥇 "Veterano" - 20 eventos
   - 💎 "Leyenda" - 50 eventos

2. **Por Puntos**:
   - 🌟 "Novato" - 500 pts
   - ⭐ "Profesional" - 1,000 pts
   - 🌠 "Experto" - 2,500 pts
   - 💫 "Maestro" - 5,000 pts

3. **Especiales**:
   - 🎯 "Perfeccionista" - Asistir a todos los eventos de una categoría
   - ⚡ "Madrugador" - Asistir a 5 eventos antes de las 9am
   - 🌙 "Noctámbulo" - Asistir a 5 eventos después de las 7pm
   - 👥 "Social" - Compartir perfil en redes

**Lógica de Otorgamiento**:
```typescript
// Después de registrar asistencia
const checkAndAwardBadges = async (userId: string) => {
  const user = await getDoc(doc(firestore, 'users', userId));
  const { points, badges: currentBadges } = user.data();
  
  // Contar asistencias
  const attendanceCount = await getCountFromServer(
    collection(firestore, `users/${userId}/attendance`)
  );
  
  const newBadges = [];
  
  // Verificar cada tipo de badge
  BADGE_DEFINITIONS.forEach(badge => {
    if (currentBadges.includes(badge.id)) return; // Ya tiene
    
    let earned = false;
    switch (badge.requirement.type) {
      case 'attendance_count':
        earned = attendanceCount >= badge.requirement.value;
        break;
      case 'points_total':
        earned = points >= badge.requirement.value;
        break;
      // ... otros tipos
    }
    
    if (earned) newBadges.push(badge.id);
  });
  
  if (newBadges.length > 0) {
    await updateDoc(doc(firestore, 'users', userId), {
      badges: arrayUnion(...newBadges)
    });
    
    // Mostrar celebración
    showBadgeUnlockedModal(newBadges);
  }
};
```

---

## 8. CRITERIOS DE ACEPTACIÓN - CHECKLIST

### CA1: Flujo de Asistencia ✅
- [ ] Botón "Marcar Asistencia" visible en detalle de evento EN CURSO
- [ ] Escáner QR abre cámara con overlay de guías
- [ ] Validación: QR correcto, no duplicado, evento activo
- [ ] Registro atómico (transacción Firestore)
- [ ] Feedback visual: Animación de confeti + checkmark
- [ ] Feedback sonoro: Tono de éxito (opcional)
- [ ] Toast de confirmación con puntos ganados
- [ ] Actualización inmediata de puntos en header
- [ ] Modal de resumen post-registro

### CA2: Eventos en Curso ✅
- [ ] Sistema de detección automática (polling o listeners)
- [ ] Toast in-app al iniciar evento
- [ ] Diferenciación visual: Borde rojo brillante + badge "EN VIVO"
- [ ] Animación de pulso en eventos activos
- [ ] Ordenamiento: Eventos EN CURSO primero en lista
- [ ] Color distintivo en cronograma

### CA3: Ranking ✅
- [ ] Query excluye usuarios con 0 puntos
- [ ] Excluye admins del ranking
- [ ] Ordenado por puntos DESC
- [ ] Muestra posición (#), nombre, puntos, asistencias
- [ ] Podio visual para top 3
- [ ] "Mi posición" sticky en perfil y ranking
- [ ] Datos consistentes con asistencias registradas

### CA4: QR Descargable ✅
- [ ] Generación automática al crear evento
- [ ] QR único y permanente por evento
- [ ] Formato PNG de alta resolución
- [ ] Opción de descarga en modal de evento
- [ ] Opción de impresión (PDF)
- [ ] Incluye metadatos visuales (logo, nombre, fecha)

### CA5: Edición Admin ✅
- [ ] Admin puede editar nombre de usuario
- [ ] Admin puede ajustar puntos (con log)
- [ ] Admin puede cambiar rol
- [ ] Admin puede editar todos los campos de evento
- [ ] Admin puede regenerar/invalidar QR
- [ ] Admin puede ver listado de asistentes por evento
- [ ] Admin puede exportar datos

### CA6: Vista Cronograma ✅
- [ ] Timeline vertical de 7:00 a 21:00
- [ ] Eventos posicionados según hora de inicio
- [ ] Duración visual (altura de bloque)
- [ ] Eventos concurrentes en paralelo (máx 3)
- [ ] Colores según estado (live/upcoming/past)
- [ ] Tap abre detalle de evento
- [ ] Responsive (desktop y mobile)
- [ ] Botón "Ir a ahora" (scroll a hora actual)

### CA7: UX/UI Coherente ✅
- [ ] Paleta de colores implementada (rojo + variantes)
- [ ] Tipografía Inter aplicada consistentemente
- [ ] Contraste WCAG AA en todos los textos
- [ ] Estados hover/focus visibles
- [ ] Touch targets mínimo 44x44px
- [ ] Animaciones sutiles y funcionales
- [ ] Responsive en todos los breakpoints
- [ ] Loading states (skeletons)
- [ ] Error states informativos

### CA8: Documentación ✅
- [ ] Documento de reglas de puntos
- [ ] Definición de "evento en curso" (ventana de tiempo)
- [ ] Lógica de validación de QR
- [ ] Medidas anti-fraude documentadas
- [ ] README actualizado con arquitectura
- [ ] Comentarios en código crítico

---

## 9. MEDIDAS ANTI-FRAUDE

### Validaciones de Asistencia
1. **QR Único por Evento**: No se puede reutilizar entre eventos
2. **Ventana Temporal**: Solo durante el evento ±15 min
3. **Una Asistencia por Usuario**: ID compuesto previene duplicados
4. **Timestamp Verificable**: Registrado en servidor (serverTimestamp)
5. **Geolocalización** (Opcional): Validar proximidad al venue
6. **Rate Limiting**: Máximo 1 escaneo por minuto por usuario
7. **Invalidación de QR**: Admin puede revocar QR comprometidos

### Monitoreo Admin
- Log de intentos fallidos (usuario, evento, timestamp, motivo)
- Alertas de patrones sospechosos:
  - Múltiples escaneos del mismo QR en corto tiempo
  - Asistencias desde ubicaciones improbables
  - Usuarios con tasa alta de fallos
- Dashboard de auditoría

---

## 10. PLAN DE IMPLEMENTACIÓN

### Fase 1: Fundamentos (Prioridad Alta - CA Críticos)
**Sprint 1** (3-5 días):
1. Sistema de diseño: Paleta de colores, tokens CSS
2. Tipos TypeScript actualizados (Event con points, status, qrCode)
3. Refactorizar página de eventos con estados visuales
4. Implementar detección de eventos EN CURSO

**Sprint 2** (3-5 días):
5. Escáner QR mejorado con validaciones
6. Flujo completo de asistencia con feedback
7. Generación y descarga de QR por evento
8. Sistema de transacciones atómicas

### Fase 2: Funcionalidades Core (Prioridad Media)
**Sprint 3** (3-5 días):
9. Ranking real conectado a Firestore
10. Perfil con posición y estadísticas
11. Admin: Edición de usuarios y eventos
12. Historial de asistencias

**Sprint 3** (3-5 días):
13. Vista cronograma/itinerario
14. Sistema de badges
15. Notificaciones in-app
16. Dashboard admin con métricas

### Fase 3: Enhancements (Prioridad Baja)
**Sprint 5** (2-3 días):
17. Recordatorios pre-evento
18. Búsquedas y filtros avanzados
19. Exportación de reportes
20. Optimizaciones de rendimiento

### Fase 4: Pulido y Testing
**Sprint 6** (2-3 días):
21. Testing de todos los CA
22. Ajustes de accesibilidad
23. Optimización de imágenes
24. Documentación final

---

## 11. DECISIONES UX RAZONADAS

### 1. Modal vs Página Completa para Detalle de Evento
**Decisión**: Modal (Dialog/Sheet)  
**Razón**: Reduce friction. Usuario puede cerrar rápido y volver a explorar eventos sin perder contexto. Menos navegación = más engagement.

### 2. Escáner QR Automático vs Manual
**Decisión**: Auto-detección con overlay de guías  
**Razón**: Menos pasos. Usuario solo apunta, el sistema escanea automáticamente. Feedback visual (guías) ayuda a alinear correctamente.

### 3. Confirmación Post-Asistencia
**Decisión**: Modal de celebración obligatorio  
**Razón**: Refuerzo positivo. Gamificación efectiva requiere reconocimiento inmediato. Aumenta dopamina y engagement.

### 4. Ranking sin Usuarios con 0 Puntos
**Decisión**: Excluir de listado público  
**Razón**: Motivación. Ver "0 pts" es desmotivante. Solo mostrar usuarios activos crea sensación de comunidad comprometida.

### 5. Eventos EN CURSO con Color Rojo Brillante
**Decisión**: Rojo brillante pulsante (#FF3333)  
**Razón**: Urgencia visual. Rojo = "actúa ahora". Animación de pulso atrae atención sin ser intrusivo. FOMO positivo.

### 6. Máximo 3 Eventos Paralelos en Cronograma
**Decisión**: Limitar visualmente a 3 columnas  
**Razón**: Legibilidad. Más de 3 requiere scroll horizontal (fricción). Si hay más, mostrar los 3 más relevantes + botón "Ver más".

### 7. Feedback Sonoro Opcional
**Decisión**: Sonido de éxito con toggle en settings  
**Razón**: Accesibilidad. Algunos usuarios valoran feedback auditivo, otros lo encuentran molesto. Dar control.

### 8. Ajuste Manual de Puntos por Admin
**Decisión**: Permitir con log de auditoría  
**Razón**: Flexibilidad operativa. Errores ocurren. Admin debe poder corregir sin eliminar registros. Log previene abuso.

### 9. QR Permanente vs Temporal
**Decisión**: Permanente con opción de invalidar  
**Razón**: Practicidad. Admin imprime una vez. Si se compromete, puede invalidar y generar nuevo. Balance entre seguridad y conveniencia.

### 10. Badges Automáticos vs Manuales
**Decisión**: Otorgamiento automático en cloud function  
**Razón**: Escalabilidad. No depende de acción admin. Instant gratification para usuarios. Reduce carga administrativa.

---

## 12. PRÓXIMOS PASOS EJECUTIVOS

1. **Validar Especificación**: Revisión con stakeholders
2. **Crear Issues/Tickets**: Desglosar sprints en tareas
3. **Preparar Assets**: Logos, imágenes placeholder, iconos de badges
4. **Configurar Entorno**: Variables de entorno, servicios externos
5. **Iniciar Sprint 1**: Sistema de diseño + tipos

**Fecha de entrega objetivo**: 2 semanas desde inicio

---

**Documento aprobado por**: Product Owner + UX/UI Lead  
**Última actualización**: 10 noviembre 2025
