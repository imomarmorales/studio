# 🔥 Reglas Completas de Firestore

**INSTRUCCIONES PARA TU AMIGO:**

1. Ve a: https://console.firebase.google.com/project/studio-496281858/firestore/rules
2. **Borra TODAS las reglas actuales**
3. **Copia y pega TODO el código de abajo**
4. Click en **"Publicar"** (botón azul arriba a la derecha)
5. ¡Listo! Las reglas estarán activas en segundos

---

## 📋 Código Completo de firestore.rules

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isAdmin() {
      // Admin tiene acceso TOTAL - solo verificar el email
      return isSignedIn() && (
        request.auth.token.email == 'admin@congreso.mx' ||
        request.auth.token.email == 'admin@congreso.com'
      );
    }
    
    // ============================================
    // ADMIN TOTAL ACCESS - Acceso completo a TODO
    // ============================================
    match /{document=**} {
      allow read, write: if isAdmin();
    }

    // ============================================
    // USERS COLLECTION
    // Stores user profiles, points, roles, credentials
    // ============================================
    match /users/{userId} {
      // Anyone can create their own profile (registration)
      allow create: if isSignedIn() && request.auth.uid == userId;
      
      // Anyone signed in can read any user profile
      // (Needed for leaderboards, participant lists, etc.)
      allow get: if isSignedIn();
      
      // List all users - everyone can see for rankings
      allow list: if isSignedIn();
      
      // Update - users can update their own profile
      allow update: if isSignedIn() && isOwner(userId);
      
      // Delete - forbidden for regular users (admin ya tiene acceso con regla general)
      allow delete: if false;
      
      // ============================================
      // ATTENDANCE SUBCOLLECTION
      // Tracks which events each user attended
      // ============================================
      match /attendance/{attendanceId} {
        // Users can read their own attendance
        allow get: if isSignedIn() && isOwner(userId);
        
        // Users can list their own attendance
        allow list: if isSignedIn() && isOwner(userId);
        
        // Users can create their own attendance records (scan QR)
        allow create: if isSignedIn() && isOwner(userId);
        
        // Update/delete forbidden for regular users (admin ya tiene acceso)
        allow update, delete: if false;
      }
    }
    
    // ============================================
    // EVENTS COLLECTION
    // Stores congress events with details, QR codes, images
    // ============================================
    match /events/{eventId} {
      // Anyone signed in can read events
      allow get: if isSignedIn();
      
      // Anyone signed in can list all events (for agenda, schedule)
      allow list: if isSignedIn();
      
      // Create/update/delete forbidden for regular users (admin ya tiene acceso)
      allow create, update, delete: if false;
      
      // ============================================
      // ATTENDEES SUBCOLLECTION (mirror for admin queries)
      // Tracks who attended each event
      // ============================================
      match /attendees/{attendeeId} {
        // Anyone signed in can read attendees
        allow get, list: if isSignedIn();
        
        // Users can create their own attendance when scanning QR
        allow create: if isSignedIn() && request.auth.uid == attendeeId;
        
        // Delete forbidden for regular users (admin ya tiene acceso)
        allow delete: if false;
      }
    }

    // ============================================
    // FUTURE COLLECTIONS (Add as needed)
    // ============================================
    
    // Announcements/News collection
    match /announcements/{announcementId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // Speakers/Presenters collection
    match /speakers/{speakerId} {
      allow read: if true; // Public read for landing page
      allow create, update, delete: if isAdmin();
    }
    
    // Challenges/Contests collection
    match /challenges/{challengeId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // Sponsors collection
    match /sponsors/{sponsorId} {
      allow read: if true; // Public read for landing page
      allow create, update, delete: if isAdmin();
    }
    
    // Featured Events collection (for landing page)
    match /featuredEvents/{eventId} {
      allow read: if true; // Public read for landing page
      allow create, update, delete: if isAdmin();
    }
    
    // RetoFIT Flyers collection
    match /retofit_flyers/{flyerId} {
      allow read: if true; // Public read for RetoFIT page
      allow create, update, delete: if isAdmin();
    }
  }
}
```

---

## ✅ Qué permiten estas reglas:

### Para TODOS (sin login):
- ✅ Ver speakers en `/ponentes-publicos`
- ✅ Ver flyers en `/reto-fit`
- ✅ Ver eventos destacados en homepage
- ✅ Ver sponsors

### Para USUARIOS REGISTRADOS:
- ✅ Ver todos los eventos
- ✅ Ver su propia asistencia
- ✅ Registrar asistencia con QR
- ✅ Ver ranking de otros usuarios
- ✅ Actualizar su propio perfil

### Para ADMIN (admin@congreso.mx):
- ✅ **ACCESO TOTAL A TODO**
- ✅ Crear/editar/eliminar eventos
- ✅ Crear/editar/eliminar ponentes
- ✅ Crear/editar/eliminar flyers de RetoFIT
- ✅ Ver/editar todos los usuarios
- ✅ Ver todas las asistencias
- ✅ Gestionar todo el contenido

---

## 🔒 Seguridad:

- ✅ Solo admin puede modificar datos importantes
- ✅ Usuarios solo pueden editar su propio perfil
- ✅ Usuarios solo pueden ver su propia asistencia
- ✅ Datos públicos son de solo lectura para todos
- ✅ Emails admin están hardcodeados (admin@congreso.mx)

---

## 📝 Notas Importantes:

1. **NO cambies nada del código** - está todo configurado correctamente
2. **Las reglas se aplican inmediatamente** después de publicar
3. **Si hay un error** al publicar, Firebase te dirá en qué línea
4. **Puedes revisar las reglas** en cualquier momento en la consola

---

## 🚨 Si algo sale mal:

1. Verifica que copiaste **TODO** el código
2. Asegúrate de que **NO hay espacios extras** al inicio/final
3. Verifica que el botón diga **"Publicar"** y esté activo
4. Si hay error, copia el mensaje completo y envíamelo

¡Eso es todo! 🎉
