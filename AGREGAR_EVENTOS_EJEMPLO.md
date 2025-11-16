# Agregar Eventos de Ejemplo a Firestore

Para probar cómo se ve el itinerario con eventos reales, sigue estos pasos:

## ✅ Método Más Fácil: Usar el Panel de Admin

La forma más confiable es agregar los eventos manualmente desde http://localhost:9002/admin/events

Usa estos datos copiando y pegando:

### 📋 Evento 1: Conferencia Inaugural
```
Título: Conferencia Inaugural - Futuro de la Tecnología
Descripción: Charla magistral sobre las tendencias tecnológicas que marcarán la próxima década. Exploraremos IA, blockchain, computación cuántica y más.
Fecha: (Selecciona HOY)
Hora inicio: 09:00
Hora fin: 10:30
Ubicación: Auditorio Principal
Ponentes: Dr. Carlos Rodríguez
Puntos: 150
Duración: 1.5 horas
Imagen URL: https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80
```

### 📋 Evento 2: Taller ML
```
Título: Taller: Machine Learning Práctico
Descripción: Taller hands-on donde aprenderás los conceptos básicos de ML con ejemplos prácticos en Python y scikit-learn.
Fecha: (Selecciona HOY)
Hora inicio: 11:00
Hora fin: 13:00
Ubicación: Laboratorio A-203
Ponentes: Dra. Ana Martínez, Ing. Pedro López
Puntos: 200
Duración: 2 horas
Imagen URL: https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80
```

### 📋 Evento 3: Panel IA
```
Título: Panel: Ética en Inteligencia Artificial
Descripción: Mesa redonda con expertos discutiendo los desafíos éticos de la IA moderna y su impacto en la sociedad.
Fecha: (Selecciona HOY)
Hora inicio: 14:00
Hora fin: 15:30
Ubicación: Sala de Conferencias B
Ponentes: Panel de Expertos en IA
Puntos: 100
Duración: 1.5 horas
Imagen URL: https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80
```

### 📋 Evento 4: Workshop DevOps
```
Título: Workshop: CI/CD con GitHub Actions
Descripción: Aprende a automatizar tus despliegues con pipelines modernos usando GitHub Actions, Docker y Kubernetes.
Fecha: (Selecciona HOY)
Hora inicio: 16:00
Hora fin: 18:00
Ubicación: Laboratorio B-105
Ponentes: Ing. Roberto Sánchez
Puntos: 200
Duración: 2 horas
Imagen URL: https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80
```

### 📋 Evento 5: Networking
```
Título: Networking & Coffee Break
Descripción: Momento para conectar con otros participantes, compartir experiencias y disfrutar de un café. Oportunidad perfecta para hacer networking.
Fecha: (Selecciona HOY)
Hora inicio: 18:30
Hora fin: 19:30
Ubicación: Jardín Central
Ponentes: (dejar vacío)
Puntos: 50
Duración: 1 hora
Imagen URL: https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80
```

---

## 🚀 Método Alternativo: Script en Consola

Si prefieres un script automático, usa este que interactúa con Firestore directamente:

**Pasos:**
1. Ve a http://localhost:9002/admin/events
2. Abre la consola (F12)
3. Copia y pega este código:

```javascript
// Script para agregar eventos de ejemplo
// IMPORTANTE: Ejecuta esto en /admin/events mientras estés logueado como admin
(async function agregarEventosEjemplo() {
  console.log("🚀 Iniciando importación de eventos...");
  
  // Acceder a Firestore desde React DevTools o context
  // Espera un momento para que la página cargue completamente
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Intenta obtener Firestore del contexto global de React
  const reactRoot = document.querySelector('[data-reactroot], #__next, [id^="__next"]');
  if (!reactRoot) {
    console.error("❌ No se pudo encontrar la aplicación React. Asegúrate de estar en /admin/events");
    return;
  }
  
  // Usaremos fetch directamente a la API REST de Firestore
  console.log("📡 Usando API REST de Firestore...");
  
  const projectId = 'studio-496281858';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events`;
  
  // Obtener token de autenticación
  let authToken = null;
  try {
    // Intentar obtener del localStorage
    const firebaseKey = Object.keys(localStorage).find(key => 
      key.includes('firebase:authUser')
    );
    if (firebaseKey) {
      const authData = JSON.parse(localStorage.getItem(firebaseKey));
      authToken = authData?.stsTokenManager?.accessToken;
    }
  } catch (e) {
    console.warn("⚠️ No se pudo obtener token, continuando sin autenticación...");
  }
  
  // Función para generar fecha de hoy con hora específica
  function getTodayWithTime(hour, minute = 0) {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  }
  
  // Función para generar token QR único
  function generateQRToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  // Función para convertir a formato Firestore
  function toFirestoreFormat(obj) {
    const result = { fields: {} };
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result.fields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        result.fields[key] = { integerValue: value };
      } else if (typeof value === 'boolean') {
        result.fields[key] = { booleanValue: value };
      } else if (Array.isArray(value)) {
        result.fields[key] = {
          arrayValue: {
            values: value.map(v => ({ stringValue: v }))
          }
        };
      }
    }
    return result;
  }
  
  // Array de eventos de ejemplo
  
  // Función para generar fecha de hoy con hora específica
  function getTodayWithTime(hour, minute = 0) {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  }
  
  // Función para generar token QR único
  function generateQRToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  // Array de eventos de ejemplo
  const eventos = [
    {
      title: "Conferencia Inaugural - Futuro de la Tecnología",
      description: "Charla magistral sobre las tendencias tecnológicas que marcarán la próxima década. Exploraremos IA, blockchain, computación cuántica y más.",
      dateTime: getTodayWithTime(9, 0),
      endDateTime: getTodayWithTime(10, 30),
      location: "Auditorio Principal",
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
      pointsPerAttendance: 150,
      qrToken: generateQRToken(),
      qrValid: true,
      speakers: ["Dr. Carlos Rodríguez"],
      duration: "1.5 horas"
    },
    {
      title: "Taller: Machine Learning Práctico",
      description: "Taller hands-on donde aprenderás los conceptos básicos de ML con ejemplos prácticos en Python y scikit-learn.",
      dateTime: getTodayWithTime(11, 0),
      endDateTime: getTodayWithTime(13, 0),
      location: "Laboratorio A-203",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
      pointsPerAttendance: 200,
      qrToken: generateQRToken(),
      qrValid: true,
      speakers: ["Dra. Ana Martínez", "Ing. Pedro López"],
      duration: "2 horas"
    },
    {
      title: "Panel: Ética en Inteligencia Artificial",
      description: "Mesa redonda con expertos discutiendo los desafíos éticos de la IA moderna y su impacto en la sociedad.",
      dateTime: getTodayWithTime(14, 0),
      endDateTime: getTodayWithTime(15, 30),
      location: "Sala de Conferencias B",
      imageUrl: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80",
      pointsPerAttendance: 100,
      qrToken: generateQRToken(),
      qrValid: true,
      speakers: ["Panel de Expertos en IA"],
      duration: "1.5 horas"
    },
    {
      title: "Workshop: CI/CD con GitHub Actions",
      description: "Aprende a automatizar tus despliegues con pipelines modernos usando GitHub Actions, Docker y Kubernetes.",
      dateTime: getTodayWithTime(16, 0),
      endDateTime: getTodayWithTime(18, 0),
      location: "Laboratorio B-105",
      imageUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80",
      pointsPerAttendance: 200,
      qrToken: generateQRToken(),
      qrValid: true,
      speakers: ["Ing. Roberto Sánchez"],
      duration: "2 horas"
    },
    {
      title: "Networking & Coffee Break",
      description: "Momento para conectar con otros participantes, compartir experiencias y disfrutar de un café. Oportunidad perfecta para hacer networking.",
      dateTime: getTodayWithTime(18, 30),
      endDateTime: getTodayWithTime(19, 30),
      location: "Jardín Central",
      imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
      pointsPerAttendance: 50,
      qrToken: generateQRToken(),
      qrValid: true,
      speakers: [],
      duration: "1 hora"
    }
  ];
  
  // Agregar cada evento a Firestore
  let exitosos = 0;
  let errores = 0;
  
  for (const evento of eventos) {
    try {
      const firestoreDoc = toFirestoreFormat(evento);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(firestoreDoc)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Agregado: ${evento.title}`);
        exitosos++;
      } else {
        const error = await response.text();
        console.error(`❌ Error al agregar ${evento.title}:`, error);
        errores++;
      }
    } catch (error) {
      console.error(`❌ Error al agregar ${evento.title}:`, error);
      errores++;
    }
    
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(`🎉 Importación completada!`);
  console.log(`✅ Eventos agregados: ${exitosos}`);
  if (errores > 0) {
    console.log(`❌ Errores: ${errores}`);
    console.log("\n⚠️ Si hubo errores, usa el método manual copiando los datos.");
  }
  console.log("=".repeat(50));
  console.log("\n📱 Ahora ve a http://localhost:9002/agenda");
  console.log("🔄 Cambia a la pestaña 'Mi Itinerario' para ver los eventos\n");
  
  if (exitosos > 0) {
    console.log("🔄 Recargando página para ver los eventos...");
    setTimeout(() => location.reload(), 2000);
  }
})();
```

5. **Presiona Enter** y espera a que termine
6. **Ve a** http://localhost:9002/agenda
7. **Cambia a la pestaña "Mi Itinerario"**
8. ¡Verás los 5 eventos organizados por hora!

## 📋 Eventos que se crearán:

### 09:00 - 10:30 | Conferencia Inaugural
- **Ubicación**: Auditorio Principal
- **Ponente**: Dr. Carlos Rodríguez
- **Puntos**: 150
- 🖼️ Imagen de tecnología/conferencia

### 11:00 - 13:00 | Taller Machine Learning
- **Ubicación**: Laboratorio A-203
- **Ponentes**: Dra. Ana Martínez, Ing. Pedro López
- **Puntos**: 200
- 🖼️ Imagen de código/IA

### 14:00 - 15:30 | Panel de Ética en IA
- **Ubicación**: Sala de Conferencias B
- **Ponente**: Panel de Expertos
- **Puntos**: 100
- 🖼️ Imagen de debate/discusión

### 16:00 - 18:00 | Workshop CI/CD
- **Ubicación**: Laboratorio B-105
- **Ponente**: Ing. Roberto Sánchez
- **Puntos**: 200
- 🖼️ Imagen de DevOps/GitHub

### 18:30 - 19:30 | Networking
- **Ubicación**: Jardín Central
- **Puntos**: 50
- 🖼️ Imagen de café/networking

## 🗑️ Eliminar Eventos de Prueba

Si quieres borrar los eventos de ejemplo:
1. Ve a http://localhost:9002/admin/events
2. Cada tarjeta tiene botones de editar/eliminar
3. Usa el botón de eliminar (🗑️) en cada evento

## 💡 Tips

- Los eventos se crean para **HOY** automáticamente
- Las imágenes son de Unsplash (requieren internet)
- Los QR tokens son únicos y válidos
- En móvil verás las fotos pequeñas (16x16 / 20x20)
- En desktop tendrás más espacio y detalles
- Los eventos "en curso" se resaltan en rojo
- Puedes registrar asistencia con el QR

¡Disfruta probando el itinerario! 🚀📱

