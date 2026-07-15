# Store Settings Module - Implementation Guide

## Overview
The Store Settings module allows users to manage their shop's branding and configuration. This includes uploading a custom logo, setting tax rates, and managing shop information (name, address, phone, email, etc.).

## Architecture

### Backend (NestJS)
**Location**: `backend/src/modules/settings/`

- **Entity** (`setting.entity.ts`): Defines the `Setting` table with fields:
  - `tax_rate` (decimal)
  - `shop_name`, `shop_address`, `shop_phone`
  - `shop_email`, `shop_description`, `shop_slogan`
  - `shop_logo_url` (stored as base64)

- **Service** (`settings.service.ts`): 
  - `getSettings(userId)` - Retrieves user settings (creates default if not exists)
  - `updateSettings(userId, dto)` - Updates any setting fields

- **Controller** (`settings.controller.ts`):
  - `GET /settings` - Get current settings
  - `PATCH /settings` - Update settings
  - `POST /settings/upload-logo` - Upload and convert image to base64

### Frontend (React)
**Location**: `frontend/src/`

#### Context (`context/SettingsContext.tsx`)
Provides global access to settings via `useSettings()` hook:
```typescript
const { settings, isLoading, error } = useSettings();
```

#### Service (`services/settings.service.ts`)
API communication:
- `getSettings()` - Fetch settings
- `updateSettings(data)` - Update settings

#### Settings Page (`pages/Settings.tsx`)
Tabbed interface with 4 sections:
1. **Shop Logo** - Upload, preview, and manage logo
2. **Basic Information** - Name, slogan, description
3. **Contact Information** - Phone, email, address
4. **Tax Rate** - Configure default tax rate

#### Layout Integration (`components/Layout.tsx`)
- Displays custom logo in sidebar (desktop & mobile)
- Falls back to default logo if none configured
- Uses `useSettings()` to fetch logo

#### PDF Integration (`components/WorkOrderPDF.tsx`)
- Includes logo in PDF header
- Shows placeholder if no logo configured

## Usage Examples

### 1. Upload Shop Logo
```typescript
// Settings page handles this via file input
// Logo is converted to base64 and stored in shop_logo_url
```

### 2. Use Settings in Components
```typescript
import { useSettings } from '@/context/SettingsContext';

function MyComponent() {
  const { settings } = useSettings();
  
  return (
    <div>
      <img src={settings?.shop_logo_url} alt="Logo" />
      <h1>{settings?.shop_name}</h1>
    </div>
  );
}
```

### 3. Generate PDF with Settings
```typescript
// PDF service automatically includes settings
const { workOrder, settings } = await pdfService.getPdfData(workOrderId);
await generateAndDownloadPdf(workOrder, settings);
```

## Database Schema

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY,
  tax_rate DECIMAL(5,4) DEFAULT 0.0875,
  shop_name VARCHAR(255) DEFAULT 'AutoTrack Shop',
  shop_address VARCHAR(500),
  shop_phone VARCHAR(20),
  shop_email VARCHAR(255),
  shop_description VARCHAR(500),
  shop_slogan VARCHAR(255),
  shop_logo_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## API Endpoints

### GET /settings
Retrieves current user's settings
- **Auth**: Required (JWT)
- **Roles**: admin, front_desk, technician
- **Response**: Settings object

### PATCH /settings
Updates settings fields
- **Auth**: Required (JWT)
- **Roles**: admin, front_desk, technician
- **Body**: Partial Settings object
- **Response**: Updated Settings object

### POST /settings/upload-logo
Uploads and converts image to base64
- **Auth**: Required (JWT)
- **Body**: FormData with `file` field
- **Response**: `{ url: "data:image/png;base64,..." }`

## File Size & Format Restrictions
- **Format**: PNG, JPG
- **Max Size**: 5MB
- **Recommended**: 500x500px

## Data Flow

```
User uploads logo
    ↓
FormData sent to POST /settings/upload-logo
    ↓
Backend converts file to base64
    ↓
Updates shop_logo_url in database
    ↓
Frontend receives base64 URL
    ↓
Logo displayed in sidebar & PDFs via useSettings()
```

## Environment Variables
No specific environment variables needed beyond standard database config.

## Dependencies
- Backend: `@nestjs/platform-express` (file handling)
- Frontend: `@react-query/react`, `react-hook-form`, `zod`
- PDF: `@react-pdf/renderer`

## Testing Checklist
- [ ] Upload logo via Settings page
- [ ] Logo appears in sidebar (desktop)
- [ ] Logo appears in sidebar (mobile)
- [ ] Logo appears in PDF header
- [ ] Update tax rate field
- [ ] Update shop name
- [ ] Update contact information
- [ ] Fallback to default logo if none uploaded
- [ ] Settings persist across page reloads
- [ ] Logo uses fallback when unavailable

## Future Enhancements
- [ ] Image compression before upload
- [ ] Image cropping tool
- [ ] Multiple logo versions (light/dark mode)
- [ ] Logo management in admin panel
- [ ] Batch settings update
- [ ] Settings versioning/history
