# AGENTS.md — Shop Management System

## 1. Descripción del proyecto

Sistema de gestión para **un solo taller mecánico** (single shop, no multi-sucursal)
ubicado en Estados Unidos. El sistema permite registrar clientes, sus vehículos, las
órdenes de trabajo realizadas (piezas + mano de obra), llevar el control de **deudas
y abonos** de cada cliente, y generar automáticamente un PDF descargable de la
orden/factura.

**Idioma de negocio:** Todo el contenido de fondo (base de datos, mensajes del sistema,
PDFs, logs, nombres de tablas/campos, código) está en **inglés**.
**Idioma de interfaz:** El frontend soporta un toggle **EN/ES** (`react-i18next`) que
SOLO traduce textos de interfaz (labels, botones, menús). Nunca traduce PDFs ni el
contenido guardado en base de datos.

## 2. Flujo funcional (core business logic)

### 2.1 Recepción del cliente
Cuando un cliente llega al taller, el staff (front_desk) registra:
- Número de teléfono (formato EEUU) — identificador para buscar si el cliente ya existe
- Nombre del cliente
- Placa del vehículo (plate)
- Modelo del vehículo (model)
- Descripción de lo que necesita (ej: "rear brake replacement")

Un mismo cliente (identificado por teléfono) puede tener **múltiples vehículos**
asociados (múltiples placas), y cada vehículo puede tener **múltiples órdenes de
trabajo** a lo largo del tiempo.

### 2.2 Después de hecho el trabajo
El staff selecciona el vehículo/orden y agrega ítem por ítem:
- Piezas cambiadas → **texto libre** (nombre + precio, SIN control de inventario/stock,
  no hay catálogo de partes, se escribe manualmente cada vez)
- Valor de la mano de obra (labor)

Con esos ítems se calcula:
```
subtotal   = suma de todos los ítems (piezas + labor)
taxRate    = configurable por el admin, default 8.75% (0.0875)
             — se debe GUARDAR el taxRate usado en cada orden (snapshot),
               para que si después cambia la config, las órdenes viejas no
               se recalculen con el nuevo valor
tax        = subtotal * taxRate
total      = subtotal + tax
```

### 2.3 Pagos y sistema de deudas (⚠️ punto central del negocio)

El flujo real es:
1. Se termina el trabajo → se genera el total de la orden
2. El cliente puede pagar **completo en ese momento** → se genera el PDF como factura,
   orden queda `paid`, balance = 0
3. O el cliente puede **pagar por partes (abonos)** a lo largo del tiempo → cada abono
   se registra individualmente, y el sistema debe permitir ver en cualquier momento
   **cuánto debe ese cliente en total** (sumando el balance pendiente de todas sus
   órdenes con deuda)

Esto requiere:
- Una tabla `Payment` que registre cada abono (fecha, monto, método, a qué orden
  pertenece, quién lo recibió)
- Un cálculo derivado por orden: `amountPaid` (suma de sus payments) y
  `balanceDue = total - amountPaid`
- Estado de la orden derivado del balance:
  - `pending`: no se ha pagado nada (amountPaid = 0)
  - `partial`: se ha abonado algo pero no todo (0 < amountPaid < total)
  - `paid`: balance = 0
- **Una vista de "cuentas por cobrar" por cliente**: mostrar la suma de balances
  pendientes de TODAS las órdenes de ese cliente (esto es un requerimiento explícito
  del dueño del negocio, no opcional)

### 2.4 PDF automático
Al finalizar una orden se puede generar un PDF (por ahora **solo descargable**, sin
envío automático por email/WhatsApp ni integración de impresión — eso queda fuera de
alcance por ahora) con:
- Datos del taller (header)
- Datos del cliente y vehículo
- Tabla de ítems (parts + labor)
- Subtotal, tax (con el % usado), total
- Monto pagado y balance pendiente si aplica
- Siempre en **inglés**, sin importar el idioma activo de la UI

### 2.5 Reportes
**Fuera de alcance por ahora.** No se requieren reportes de ventas, por técnico, ni
dashboards analíticos en esta etapa. Solo registro y consulta de deudas.

## 3. Entidades principales (modelo de datos)

```
User          (id, name, email, password_hash, role, created_at)

Customer      (id, name, phone, created_at)

Vehicle       (id, customer_id, plate, model, description, created_at)

WorkOrder     (id, vehicle_id, description_needed, subtotal, tax_rate, tax, total,
               created_at, created_by)
               // status y balance se calculan a partir de Payment, no se guardan
               // como fuente de verdad rigida (o se guardan como cache derivado
               // recalculado en cada cambio de Payment)

WorkOrderItem (id, work_order_id, type[part|labor], name, price, qty)

Payment       (id, work_order_id, amount, method[cash|card|check|other], date,
               created_by)

Settings      (id, tax_rate, shop_name, shop_address, shop_phone)
               // fila unica de configuracion, editable solo por admin
```

### Relaciones
- Customer 1:N Vehicle
- Vehicle 1:N WorkOrder
- WorkOrder 1:N WorkOrderItem
- WorkOrder 1:N Payment
- Settings: tabla singleton (una sola fila) con la configuración del taller

### Vista derivada importante: "Customer Debt"
```
customerBalance = suma de (total - amountPaid) de TODAS las WorkOrders
                  de ese customer donde balance > 0
```
Esto debe existir como endpoint/consulta explícita, ej:
`GET /customers/:id/balance` → { totalDebt, workOrdersWithDebt: [...] }

## 4. Roles del sistema

| Rol | Permisos |
|---|---|
| `admin` | Acceso total: usuarios, configuración (tax rate, datos del taller), todo lo demás |
| `front_desk` | Crea clientes, vehículos, órdenes, registra pagos/abonos |
| `technician` | Ve órdenes asignadas, agrega ítems/piezas usadas |

## 5. Stack tecnológico

### Backend
- NestJS + TypeScript
- TypeORM + PostgreSQL
- JWT propio + Passport.js (passport-jwt) — NO Firebase Auth
- bcrypt (hash de contraseñas)
- class-validator / class-transformer (DTOs)
- **PDFKit** para generación de PDF (NO Puppeteer — se descartó por peso de Chromium
  y problemas de compatibilidad con serverless; PDFKit dibuja el PDF directamente,
  sin navegador headless, ideal para Vercel)
- Swagger (documentación de API)
- Gestor de paquetes: **pnpm**

### Frontend
- React + Vite + TypeScript
- TailwindCSS v4 (`@tailwindcss/vite`)
- React Router
- react-i18next (toggle EN/ES solo en UI)
- Axios + TanStack Query
- React Hook Form + Zod
- Gestor de paquetes: **pnpm**

### Base de datos
- PostgreSQL (recomendado: Neon o Supabase por el pooling de conexiones,
  necesario si el backend corre en serverless/Vercel)

### Deploy
- Frontend: Vercel
- Backend: Vercel es viable ahora que NO se usa Puppeteer (sin problema de bundle
  size de Chromium). Alternativa: Railway/Render si se prefiere un servidor
  "always-on" tradicional sin las particularidades de serverless (cold starts,
  pool de conexiones a DB).

## 6. Convenciones de código

- Todo el código, nombres de variables, tablas, campos, mensajes de error → **inglés**
- DTOs con validación estricta (`class-validator`) en cada endpoint
- Rutas protegidas con `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`
- Cada entidad TypeORM en su propio módulo (`modules/customers`, `modules/vehicles`, etc.)
- Frontend: componentes en `src/components`, páginas en `src/pages`,
  llamadas API centralizadas en `src/services`, traducciones en `src/locales/en.json`
  y `src/locales/es.json`
- El tax rate NUNCA se hardcodea: vive en la tabla `Settings`, editable por admin,
  con un valor default de 8.75% al hacer seed inicial
- Cada `WorkOrder` guarda el `tax_rate` que se usó al momento de crearse (snapshot),
  no una referencia dinámica a `Settings`

## 7. Fases del proyecto

- **Fase 1:** Setup del proyecto + Autenticación (JWT) + Módulo de Usuarios y Roles ✅
- **Fase 2:** Frontend — Customers + Vehicles (diseño y flujo, conectado a backend real,
  sin validaciones estrictas) ✅
- **Fase 3:** Frontend puro — WorkOrders + Items + cálculo de subtotal/tax/total
  (con service simulado en memoria) ✅
- **Fase 4:** Backend real de WorkOrders + WorkOrderItems (reemplazar el service
  simulado por endpoints reales de NestJS)
- **Fase 5:** Sistema de Payments/abonos + cálculo de balance/deuda por orden y por cliente
- **Fase 6:** Módulo de Settings (tax rate configurable, datos del taller para el PDF)
- **Fase 7:** Generación de PDF con PDFKit (descargable)
- **Fase 8:** Pulido general de UI, validaciones estrictas ("hardening"), deploy

## 8. Estructura de carpetas

```
shop-management-system/
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── customers/
│       │   ├── vehicles/
│       │   ├── work-orders/
│       │   ├── work-order-items/
│       │   ├── payments/
│       │   └── settings/
│       ├── common/        (guards, decorators, filters)
│       ├── app.module.ts
│       └── main.ts
│
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        │   └── ui/
        ├── services/
        ├── hooks/
        ├── context/
        ├── config/         (constants.ts)
        ├── locales/
        │   ├── en.json
        │   └── es.json
        └── types/
```

## 9. Fuera de alcance (por ahora, confirmado con el dueño del negocio)

- Reportes/dashboards de ventas
- Envío automático de PDF por email o WhatsApp
- Integración con impresoras
- Control de inventario de piezas (stock, cantidad disponible, alertas de bajo stock)
- Multi-sucursal

## 10. Decisiones ya confirmadas (ya no están pendientes)

- Tax rate: **configurable**, default **8.75%**, editable por admin en `Settings`
- Un solo taller, no multi-tenant
- Piezas: texto libre, sin inventario
- Sí existe sistema de deudas/cuentas por cobrar por cliente (no solo por orden)
- PDF: solo descargable, sin envío automático
- Sin reportes en esta etapa
- PDF se genera con **PDFKit**, no Puppeteer