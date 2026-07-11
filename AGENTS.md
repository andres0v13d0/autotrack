# AGENTS.md — Shop Management System

## 1. Descripción del proyecto

Sistema de gestión para un taller mecánico (auto repair shop) ubicado en Estados Unidos.
El sistema permite registrar clientes, sus vehículos, las órdenes de trabajo realizadas
(piezas + mano de obra), los pagos (contado, crédito, abonos) y generar automáticamente
un PDF de la orden/factura.

**Idioma de negocio:** Todo el contenido de fondo (base de datos, mensajes del sistema,
PDFs, emails, logs, nombres de tablas/campos, código) está en **inglés**.
**Idioma de interfaz:** El frontend (UI visible al usuario) debe soportar un toggle
**EN/ES** usando `react-i18next`. El toggle SOLO traduce textos de interfaz
(labels, botones, menús). Nunca traduce PDFs, ni el contenido guardado en base de datos.

## 2. Flujo funcional (core business logic)

### 2.1 Recepción del cliente
Cuando un cliente llega al taller, el staff (front_desk) registra:
- Número de teléfono (formato EEUU)
- Nombre del cliente
- Placa del vehículo (plate)
- Modelo del vehículo (model)
- Descripción de lo que necesita (ej: "rear brake replacement")

Un mismo cliente (identificado por teléfono, único) puede tener **múltiples vehículos**
asociados (múltiples placas).

### 2.2 Después de hecho el trabajo
El staff selecciona el vehículo/orden y agrega ítem por ítem:
- Piezas cambiadas (nombre + precio)
- Valor de la mano de obra (labor)

Con esos ítems se calcula:
```
subtotal = suma de todos los ítems (piezas + labor)
tax      = subtotal * TAX_RATE   (configurable, ej. 0.08625 u 0.0875 — definir valor final)
total    = subtotal + tax
```

### 2.3 Estado de pago
Cada orden de trabajo tiene un estado de pago:
- `paid` (pagado completo)
- `credit` (a crédito, pendiente)
- `partial` (con abonos — se registran pagos parciales en tabla `Payment`)
- `pending` (sin pago aún)

### 2.4 PDF automático
Al finalizar una orden, el sistema genera automáticamente un PDF con:
- Datos del taller (header)
- Datos del cliente y vehículo
- Tabla de ítems (parts + labor)
- Subtotal, tax, total
- Estado de pago / saldo pendiente si aplica
- Todo el PDF se genera **siempre en inglés**, sin importar el idioma activo de la UI.

## 3. Entidades principales (modelo de datos)

```
User          (id, name, email, password_hash, role, created_at)
Customer      (id, name, phone, created_at)
Vehicle       (id, customer_id, plate, model, description, created_at)
WorkOrder     (id, vehicle_id, description_needed, status, payment_status,
               subtotal, tax, total, created_at, created_by)
WorkOrderItem (id, work_order_id, type[part|labor], name, price, qty)
Payment       (id, work_order_id, amount, method, date, created_by)
```

### Relaciones
- Customer 1:N Vehicle
- Vehicle 1:N WorkOrder
- WorkOrder 1:N WorkOrderItem
- WorkOrder 1:N Payment
- User (staff) crea/gestiona Customers, Vehicles, WorkOrders, Payments

## 4. Roles del sistema

| Rol | Permisos |
|---|---|
| `admin` | Acceso total: usuarios, reportes, precios, tax, todo lo demás |
| `front_desk` | Crea clientes, vehículos, órdenes, marca pagos |
| `technician` | Ve órdenes asignadas, agrega ítems/piezas usadas |

## 5. Stack tecnológico

### Backend
- NestJS + TypeScript
- TypeORM + PostgreSQL
- JWT propio + Passport.js (passport-jwt) — NO Firebase Auth
- bcrypt (hash de contraseñas)
- class-validator / class-transformer (DTOs)
- Puppeteer (generación de PDF)
- Swagger (documentación de API)
- Gestor de paquetes: **pnpm**

### Frontend
- React + Vite + TypeScript
- TailwindCSS v4 (`@tailwindcss/vite`)
- React Router (navegación)
- react-i18next (toggle EN/ES solo en UI)
- Axios + TanStack Query (comunicación con API)
- React Hook Form + Zod (formularios y validación)
- Gestor de paquetes: **pnpm**

### Base de datos
- PostgreSQL

## 6. Convenciones de código

- Todo el código, nombres de variables, tablas, campos, mensajes de error → **inglés**
- DTOs con validación estricta (`class-validator`) en cada endpoint
- Rutas protegidas con `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`
- Cada entidad TypeORM en su propio módulo (`modules/customers`, `modules/vehicles`, etc.)
- Frontend: componentes en `src/components`, páginas en `src/pages`,
  llamadas API centralizadas en `src/services`, traducciones en `src/locales/en.json`
  y `src/locales/es.json`
- Variables de entorno para configuración (TAX_RATE, JWT_SECRET, DATABASE_*)

## 7. Fases del proyecto

- **Fase 1:** Setup del proyecto + Autenticación (JWT) + Módulo de Usuarios y Roles
- **Fase 2:** Módulo de Customers + Vehicles (CRUD completo, relación 1:N)
- **Fase 3:** Módulo de WorkOrders + WorkOrderItems (creación de ítems, cálculo subtotal/tax/total)
- **Fase 4:** Módulo de Payments (pagos parciales, estados de pago)
- **Fase 5:** Generación automática de PDF (Puppeteer)
- **Fase 6:** i18n en frontend (toggle EN/ES) + pulido de UI
- **Fase 7:** Testing, variables de entorno de producción, deploy

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
│       │   └── payments/
│       ├── common/        (guards, decorators, filters)
│       ├── app.module.ts
│       └── main.ts
│
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        ├── services/
        ├── hooks/
        ├── context/
        ├── locales/
        │   ├── en.json
        │   └── es.json
        └── types/
```

## 9. Notas importantes / decisiones pendientes

- [ ] Confirmar TAX_RATE definitivo (se mencionó 0.08625 y también 0.0875 — usar UNO solo)
- [ ] Definir nombre comercial del taller (para header del PDF)
- [ ] Definir si el teléfono se valida con formato estricto EEUU (ej. `+1 (XXX) XXX-XXXX`)