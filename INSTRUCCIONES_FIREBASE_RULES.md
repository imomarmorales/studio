# Cómo actualizar las reglas de Firestore manualmente

## PROBLEMA
El comando `firebase deploy --only firestore:rules` da error de permisos 403.

## SOLUCIÓN
Actualizar las reglas manualmente desde la consola web de Firebase.

## PASOS:

1. Abre tu navegador y ve a: https://console.firebase.google.com/

2. Selecciona el proyecto: **studio-496281858**

3. En el menú lateral izquierdo, haz click en **Firestore Database**

4. Haz click en la pestaña **Reglas** (o **Rules** si está en inglés)

5. Verás un editor de código. **BORRA TODO** el contenido actual.

6. Abre el archivo `firestore.rules` de tu proyecto (está en la raíz del proyecto)

7. **COPIA TODO** el contenido del archivo `firestore.rules`

8. **PEGA** el contenido en el editor de la consola de Firebase

9. Haz click en el botón **Publicar** (o **Publish**)

10. Espera a que se desplieguen las reglas (tarda 5-10 segundos)

## VERIFICAR QUE FUNCIONÓ:

Después de publicar, busca en las reglas estas líneas:

```
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
```

Si ves `allow read: if true;` en ambas colecciones, ¡está listo!

## RESULTADO:

Una vez publicadas las reglas:
- La página principal (/) cargará sin errores
- Los sponsors y eventos que agregues en /admin/content se mostrarán automáticamente
- El admin sigue teniendo todos los permisos

---

**IMPORTANTE:** Solo necesitas hacer esto UNA VEZ. Las reglas quedan guardadas en Firebase.
