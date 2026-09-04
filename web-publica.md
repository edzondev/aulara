# Web pública (`apps/web`)

Landing de lista de espera en Astro 7 (`aulara.app`). Código en la rama `feat/public-waitlist-landing`.

Identidad (nombre, URL, correo de privacidad, ciudad, versión de la política): un solo archivo, `apps/web/src/content/site.ts`.

## 1. Identidad

En `apps/web/src/content/site.ts` completar `operatorFullName` (hoy es `"Nombre Apellido"`). El correo `privacidad@aulara.app` se deriva del dominio.

## 2. Base de datos

Migración ya generada: `packages/db/drizzle/0002_dear_ozymandias.sql` (tabla `waitlist_lead`).

Desde la raíz, con `DATABASE_URL` de Neon en el `.env`:

```bash
pnpm db:migrate
```

Sin eso el formulario carga, pero no guarda leads. Para inspeccionar: `pnpm db:studio`.

## 3. Correo

Crear el buzón `privacidad@aulara.app`. Ahí llegan solicitudes ARCO (acceso, rectificación, baja). En v1 se atienden a mano.

## 4. Deploy

- Proyecto en Vercel para `apps-web` (Astro + adapter `@astrojs/vercel`).
- Variable de producción: `DATABASE_URL`.
- Dominio `aulara.app` apuntando a Vercel (A/CNAME). HTTPS lo pone Vercel.
- Tras el primer deploy: enviar el formulario de punta a punta y comprobar la fila en Neon.

Dev local:

```bash
pnpm --filter apps-web dev
```

## 5. Legales (fuera del código)

- Abogado revisa `/privacidad` y `/terminos`.
- Inscribir el banco de datos `waitlist_lead` en la ANPD (SIPDP, gratuito).
- Declarar el flujo transfronterizo (Neon / Vercel fuera de Perú).

## 6. Git

Trabajo en `feat/public-waitlist-landing`. Cuando esté listo: commit, PR a `master`, merge.

## Fuera de v1

No hace falta para publicar: i18n, Analytics, doble opt-in, admin de leads, contrato SaaS, ni datos de alumnos.
