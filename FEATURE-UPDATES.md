# FEATURE-UPDATES.md — Refinamientos funcionales y de UI

> Este documento se lee JUNTO con `agents.md`. Contiene refinamientos y features
> nuevos detectados después de las primeras fases. Donde algo contradice una
> decisión previa de `agents.md`, se marca explícitamente con ⚠️.

---

## 1. Módulo Customers

### 1.1 Buscador
Un solo input de búsqueda que filtre por: **placa**, **nombre** o **teléfono**
del cliente (búsqueda combinada, no tres campos separados).

### 1.2 Columnas de la tabla
Simplificar la tabla principal a solo dos columnas visibles:
- Name
- Phone

### 1.3 Columna Actions (dropdown por fila)
Botón de acciones desplegable (dropdown/menu) por cada fila, con al menos:
- **Create Work Order** → acceso directo para crear una orden para ese cliente
- **Register Payment** → abre modal de pago con selector de método:
  `Zelle`, `Card`, `Cash`
- *(Pendiente de definir: ¿qué otras acciones va en este dropdown? Ej. Edit,
  View Statement, Delete)*

### 1.4 Click en la fila → Modal de detalle del cliente
Al hacer clic en cualquier parte de la fila (que NO sea el botón de acciones),
se abre un modal con:
- Datos del cliente (nombre, teléfono)
- Lista de sus vehículos
- Estado de cada vehículo (en servicio/técnico, listo, entregado — reutilizar
  los indicadores de estado del módulo Work Orders, ver sección 2.3)
- Historial de pagos de ese cliente (todas sus órdenes)
- Botón para generar PDF del historial/estado de cuenta

### 1.5 Filtros
- Filtro: **"Clientes que deben"** (con balance pendiente > 0)

### 1.6 Métodos de pago
Agregar al enum de `Payment.method` (definido en `agents.md`):
`zelle | card | cash`
*(Ajustar el enum anterior que tenía `cash|card|check|other` — confirmar si
se elimina `check`/`other` o se dejan como opciones adicionales)*

---

## 2. Módulo Work Orders

### 2.1 Número de orden legible
- Reemplazar la exposición del `id` (uuid) por un **número secuencial legible**,
  ej. `1001`, `1002`, `1003`...
- Como el sistema es de **un solo taller** (ya confirmado en `agents.md`), esto
  es simplemente un contador autoincremental único, no por sucursal.
- El `id` (uuid) se mantiene como PK interno; se agrega un campo `order_number`
  (integer, único, autoincremental, empezando en 1000 o 1001 — **definir cuál**)
  únicamente para mostrar al usuario.

### 2.2 Click en la fila → Modal de detalle de la orden
Abre un modal con el detalle completo de lo que hay que hacer: descripción del
trabajo, ítems ya agregados (si los hay), datos del vehículo y del cliente.

### 2.3 Indicador de estado (punto de color)

Un punto de color al inicio de cada fila representa el **estado de entrega**
(distinto del estado de pago, ver nota abajo):

| Estado | Significado | Color |
|---|---|---|
| `new` | Nadie la ha tocado todavía | Blanco, con borde negro |
| `in_progress` | Ya se comenzó a arreglar | Naranja |
| `ready` | Listo para entregar, aún no retirado | Azul |
| `delivered` | Ya entregado al cliente | Verde |

⚠️ **Importante — no mezclar estos dos conceptos:**
- **Estado de entrega** (`new → in_progress → ready → delivered`): dónde va
  físicamente el vehículo/trabajo
- **Estado de pago** (`pending / partial / paid`, ya definido en `agents.md`
  vía `Payment` y `balanceDue`): si debe dinero o no

Una orden puede estar `delivered` y aun así tener `debt` (el cliente se llevó
el carro pero no ha terminado de pagar). Por lo tanto en la UI deben verse
**ambos indicadores por separado** (el punto de entrega + un badge de pago),
nunca fusionados en un solo estado.

### 2.4 Vista mobile
- Las pestañas de estado (tabs) se colapsan en un dropdown/select en mobile,
  mostrando todos los estados como opciones para filtrar.

### 2.5 Flujo para marcar una orden como "Ready" (lista para entregar)
Al mover una orden a estado `ready`:
- Se muestra una vista previa tipo factura (similar al layout final del PDF)
- En este punto todos los ítems ya deben tener precio cargado
- El **tax es editable** en este paso
- Los **ítems/línea son editables** en este paso (última oportunidad de ajustar
  antes de "cerrar" el precio)
- Al confirmar este paso se fija el `subtotal/tax/total` de la orden (este es
  probablemente el momento en que se guarda el snapshot de `tax_rate` que ya
  está definido en `agents.md`)

---

## 3. Módulo Reports (Informes)

⚠️ **Esto contradice la decisión previa en `agents.md`** donde se había
confirmado "sin reportes por ahora". Queda actualizado: **sí se necesita**.

- Informe mensual: total facturado/cobrado en el mes
- Desglose diario: cuánto se hizo cada día dentro del mes
- *(Pendiente de definir: ¿el monto es sobre el total de las órdenes creadas
  ese día, o sobre los pagos efectivamente cobrados ese día? No es lo mismo si
  hay órdenes a crédito/abonos)*

---

## 4. Módulo Configuración de Tienda (Store Settings) ✅ COMPLETADO

### Implementación:

#### Backend (NestJS)
- ✅ **Entity**: `Setting` entity incluye `shop_logo_url` (text field)
- ✅ **Service**: Métodos para obtener y actualizar configuraciones
- ✅ **Controller**: 
  - `GET /settings` - Obtiene configuración del usuario
  - `PATCH /settings` - Actualiza configuración (todos los campos)
  - `POST /settings/upload-logo` - Carga y convierte logo a base64
- ✅ **Campos disponibles**:
  - `tax_rate` (decimal, 0-1)
  - `shop_name` (string)
  - `shop_address` (string)
  - `shop_phone` (string)
  - `shop_email` (string, opcional)
  - `shop_description` (string, opcional)
  - `shop_slogan` (string, opcional)
  - `shop_logo_url` (text, se almacena en base64)

#### Frontend (React)
- ✅ **Service**: `settingsService` para GET/PATCH configuración
- ✅ **Types**: Interface `Settings` actualizada con todos los campos
- ✅ **Context**: `SettingsContext` para compartir configuración globalmente
- ✅ **Page Settings.tsx**:
  - Interfaz tabbed con 4 pestañas:
    1. **Shop Logo** - Upload de imagen, preview, y gestión del logo
    2. **Basic Information** - Nombre, slogan, descripción
    3. **Contact Information** - Teléfono, email, dirección
    4. **Tax Rate** - Configuración de tasa de impuesto con preview en %
  - Upload de logo convierte a base64 automáticamente
  - Validación de formulario con Zod
  - Feedback visual de guardado exitoso
- ✅ **Layout Component**:
  - Usa `useSettings()` hook para obtener configuración
  - Muestra logo personalizado en sidebar (desktop y mobile)
  - Fallback a logo por defecto si no hay logo configurado

#### Integración con otros módulos:
- ✅ **PDF Header**: Logo se incluye en el encabezado del PDF (`WorkOrderPDF.tsx`)
- ✅ **Global Usage**: Logo disponible en toda la app via `useSettings()` hook

### Cómo usar:

1. **Configurar logo del taller**:
   - Ir a Settings → Shop Logo
   - Click en "Upload Logo"
   - Seleccionar imagen (PNG, JPG, max 5MB)
   - El logo aparecerá en el sidebar y en los PDFs

2. **Otros campos**:
   - Basic Information: Nombre, slogan, descripción
   - Contact: Teléfono, email, dirección
   - Tax Rate: Tasa de impuesto (ej: 0.0875 = 8.75%)

3. **Acceso a configuración en código**:
   ```typescript
   import { useSettings } from '@/context/SettingsContext';
   
   function MyComponent() {
     const { settings } = useSettings();
     // settings.shop_logo_url contiene la imagen en base64
     // settings.shop_name contiene el nombre del taller
   }
   ```

---

## 5. Módulo PDF ✅ COMPLETADO

- ✅ Imprime el **logo del taller** en el encabezado del PDF (además del nombre, dirección y teléfono ya contemplados)
- ✅ Logo se obtiene de settings y se renderiza en `@react-pdf/renderer`
- ✅ Si no hay logo, muestra placeholder
- ✅ Formato: logo a la izquierda, información del taller al centro, número de orden a la derecha

---

## 6. Responsive / UI ✅ PARCIALMENTE COMPLETADO

- ✅ **Logo en sidebar**: Se muestra logo personalizado en sidebar desktop y mobile
- ✅ **Fallback**: Si no hay logo, usa logo por defecto
- ⏳ **Tablas responsive**: Seguir refinando según feedback (scroll horizontal, cards, etc.)

---

## 7. Preguntas abiertas antes de construir esto

- [ ] Lista completa de acciones del dropdown de **Customers** (más allá de
      Create Order / Register Payment)
- [ ] Lista completa de acciones del dropdown de **Work Orders**
- [ ] Reports: ¿revenue por fecha de creación de orden o por fecha de pago
      recibido? ¿Se necesita selector de rango de fechas o solo "mes actual"?
- [ ] Número de orden: ¿arranca en 1000 o 1001? ¿Se reutilizan números si se
      borra una orden? (recomendación: nunca reutilizar, siempre incrementar)
- [ ] Logo: ¿restricciones de formato/tamaño? ¿dónde se almacena el archivo
      (base64 en DB, Vercel Blob, Cloudinary, S3)?
- [ ] Confirmar si `Payment.method` elimina `check`/`other` o los conserva
      además de `zelle/card/cash`
- [ ] Tablas responsive: ¿scroll horizontal o vista de cards apiladas en mobile?