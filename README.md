# Solito · gastos personales

App web instalable (PWA) para registrar gastos e ingresos en soles, con cuentas por usuario sobre Supabase.

- **Sin build:** HTML, CSS y JavaScript plano. Se publica tal cual en GitHub Pages.
- **Modo demo:** si `js/config.js` está vacío, la app guarda todo en el navegador (sirve para probar el diseño).
- **Modo real:** con la URL y la *anon key* de Supabase en `js/config.js`, cada usuario crea su cuenta y solo ve sus datos (RLS).

## Estructura

| Archivo | Qué hace |
|---|---|
| `index.html` | Pantallas: acceso, Inicio, Movimientos, Resumen, Perfil y hojas (alta de movimiento, categorías, presupuesto) |
| `css/app.css` | Estilos estilo iOS, modo claro/oscuro, áreas seguras del iPhone |
| `js/app.js` | Lógica de la interfaz |
| `js/store.js` | Capa de datos (Supabase o demo local) con la misma interfaz |
| `js/icons.js` | Íconos SVG |
| `sw.js` + `manifest.webmanifest` | Instalación en el celular y apertura sin conexión |
| `supabase/schema.sql` | Tablas, seguridad RLS y categorías por defecto al crear usuario |

## Conectar Supabase

Ya conectado al proyecto `libreta` (ref `jcxswdzvtvrtamiwsfdj`, São Paulo). Pasos, por si hay que rehacerlo:

1. Crear un proyecto en Supabase (región São Paulo, la más cercana a Lima).
2. SQL Editor → pegar y correr `supabase/schema.sql`.
3. Authentication → URL Configuration: *Site URL* = URL de GitHub Pages, y agregarla también en *Redirect URLs*.
4. Project Settings → API: copiar *Project URL* y *anon public key* a `js/config.js`.
5. Subir cambios (`git push`); GitHub Pages se actualiza solo.

## Probar en local

```bash
python3 -m http.server 5173
```

## Premium (siguiente fase)

El esquema ya deja preparado: `profiles.plan`, `profiles.whatsapp_phone`, `transactions.source` (`email`/`whatsapp`) y `transactions.external_id` (evita duplicar un correo del banco).
