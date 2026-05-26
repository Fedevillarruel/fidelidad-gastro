# Gastro Whokey

App de fidelidad para gastronomicos con soporte NFC 215 + QR + paneles por rol.

## Perfiles incluidos

- Restaurante: alta/escritura de Whokey, suma/resta/reinicio de puntos, ranking y metricas.
- Cliente: consulta de puntos, faltantes para premio y promociones.
- Super Admin: alta de restaurantes con configuracion inicial.

## Stack

- Frontend: React + TypeScript + Vite + React Router
- Datos: Supabase (Postgres + RLS) con fallback local para demo
- UI/Metricas: Recharts + Lucide
- Escaneo QR: @yudiel/react-qr-scanner

## Configuracion local

1. Instalar dependencias:

```bash
npm install
```

2. Copiar variables de entorno:

```bash
cp .env.example .env
```

3. Completar en `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

4. Levantar desarrollo:

```bash
npm run dev
```

## Supabase

Ejecutar en SQL Editor de Supabase, en este orden:

1. `supabase/schema.sql`
2. `supabase/seed.sql` (opcional para datos demo)

## Flujo NFC / QR

- Alta Whokey nuevo: en panel restaurante, cargar UID y datos cliente, luego registrar.
- Si el navegador soporta Web NFC, se intenta escribir el payload con URL de tarjeta cliente.
- Si no soporta Web NFC (comun en iOS/Safari), usar flujo QR o carga manual.
- Cliente final: al apoyar el llavero (con URL grabada) abre `/r/:slug/card/:cardCode` y ve progreso.

## Build

```bash
npm run build
```

## Publicar en GitHub

Repositorio destino:

- https://github.com/Fedevillarruel/fidelidad-gastro.git

Comandos:

```bash
git init
git add .
git commit -m "feat: bootstrap Gastro Whokey app with Supabase loyalty flows"
git branch -M main
git remote add origin https://github.com/Fedevillarruel/fidelidad-gastro.git
git push -u origin main
```

## Notas de produccion

- Activar Auth real de Supabase (email OTP, password o SSO) y mapear perfiles por usuario.
- Mover operaciones sensibles a Edge Functions o backend seguro.
- Añadir auditoria completa de movimientos, permisos por restaurante y logs de hardware NFC.
