# Store Settings Module - Quick Reference

## What This Module Does

Allows users to upload a custom logo, manage tax rates, and configure shop information (name, address, phone, email, etc.). The logo appears in the app sidebar and in PDF headers.

---

## Quick Start for Users

### To Upload a Logo:
1. Click **Settings** in the sidebar
2. Go to **Shop Logo** tab
3. Click **Upload Logo**
4. Select PNG or JPG (max 5MB)
5. Logo appears in sidebar instantly

### To Update Tax Rate:
1. Click **Settings** 
2. Go to **Tax Rate** tab
3. Enter decimal (e.g., `0.0875` for 8.75%)
4. Click **Save Changes**

### To Update Shop Info:
1. Click **Settings**
2. Go to **Basic Information** or **Contact Information**
3. Fill in desired fields
4. Click **Save Changes**

---

## Files Structure

```
Frontend:
  context/SettingsContext.tsx          ← Global settings provider
  pages/Settings.tsx                   ← Settings UI (4 tabs)
  components/Layout.tsx                ← Uses logo in sidebar
  components/WorkOrderPDF.tsx          ← Shows logo in PDF
  services/settings.service.ts         ← API calls
  types/settings.ts                    ← TypeScript types
  App.tsx                              ← Wrapped with SettingsProvider

Backend:
  modules/settings/
    ├── setting.entity.ts              ← Database table
    ├── settings.service.ts            ← Business logic
    ├── settings.controller.ts         ← API endpoints
    ├── settings.module.ts             ← Module config
    └── dto/update-setting.dto.ts      ← Input validation
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/settings` | Get user's settings |
| PATCH | `/settings` | Update settings |
| POST | `/settings/upload-logo` | Upload & convert logo to base64 |

---

## How to Use Settings in Code

```typescript
// In any component:
import { useSettings } from '@/context/SettingsContext';

function MyComponent() {
  const { settings, isLoading } = useSettings();
  
  // Use settings:
  const logo = settings?.shop_logo_url;
  const tax = (settings?.tax_rate ?? 0.0875) * 100;  // As percentage
  const shopName = settings?.shop_name;
}
```

---

## Database Fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `shop_name` | string | 'AutoTrack Shop' | Shop name |
| `shop_logo_url` | text | null | Logo as base64 |
| `tax_rate` | decimal | 0.0875 | Tax rate (0-1) |
| `shop_address` | string | '' | Shop address |
| `shop_phone` | string | '' | Shop phone |
| `shop_email` | string | '' | Shop email |
| `shop_slogan` | string | '' | Shop slogan |
| `shop_description` | string | '' | Shop description |

---

## Common Patterns

### Display Logo Safely
```typescript
<img 
  src={settings?.shop_logo_url || '/imagotipo.png'} 
  alt="Shop Logo"
/>
```

### Format Tax Rate
```typescript
const taxPercent = (settings?.tax_rate ?? 0.0875) * 100;
// 0.0875 → 8.75%
```

### Update Single Field
```typescript
const response = await settingsService.updateSettings({
  tax_rate: 0.10  // Only update tax rate
});
```

### Get All Settings
```typescript
const settings = await settingsService.getSettings();
// Returns complete settings object
```

---

## Validation Rules

### Tax Rate
- Type: number
- Min: 0
- Max: 1
- Example: `0.0875` (8.75%)

### Shop Name
- Type: string
- Min length: 2 characters
- Example: "AutoTrack Shop"

### Email (optional)
- Type: string
- Must be valid email format
- Example: "info@shop.com"

### Phone (optional)
- Type: string
- No strict validation (stored as-is)
- Example: "(305) 555-1234"

### Image File
- Formats: PNG, JPG
- Max size: 5MB
- Recommended: 500x500px

---

## Troubleshooting

### Logo not showing in sidebar?
1. Check if logo was uploaded successfully
2. Verify settings are loading (check useSettings hook)
3. Check browser console for errors
4. Refresh page

### Tax rate not calculating?
1. Verify decimal format: 0.0875 (not 8.75)
2. Check that tax_rate field is between 0 and 1
3. Refresh page after save

### Settings not saving?
1. Check network tab for 401 (auth) or 400 (validation) errors
2. Verify JWT token is valid
3. Check that file is < 5MB for logo upload
4. Check server logs

### Logo not in PDF?
1. Verify PDF service gets settings with logo_url
2. Check that base64 string is valid
3. Verify @react-pdf/renderer version supports images
4. Try generating PDF again

---

## Testing Commands

### Manual Testing
```bash
# Get settings
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/settings

# Update settings
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tax_rate":0.10}' \
  http://localhost:3000/settings

# Upload logo
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@logo.png" \
  http://localhost:3000/settings/upload-logo
```

---

## Performance Tips

1. **Logo Size**: Keep under 100KB for faster loading
2. **Caching**: Settings cached for 5 minutes
3. **Compression**: Consider image compression before upload
4. **CDN**: Could serve logos from CDN later

---

## Security Notes

- ✅ All endpoints require JWT authentication
- ✅ Role-based access (admin, front_desk, technician)
- ✅ Logo stored as base64 (safe in database)
- ✅ File upload validated on backend
- ✅ No direct file system access

---

## Integration Points

### Sidebar
- Displays logo from settings
- Falls back to default if not configured

### PDFs
- Logo in header
- Shop name, address, phone
- Order number badge

### Global
- All components can access via useSettings()
- Single source of truth

---

## Next Steps

1. **To Add New Settings Field**:
   - Add to database migration
   - Add to Setting entity
   - Add to UpdateSettingDto
   - Add to Settings type
   - Add to Settings.tsx form
   - Use with useSettings()

2. **To Customize Logo Display**:
   - Modify Layout.tsx
   - Change logo styling
   - Add logo resizing

3. **To Add Settings Export**:
   - Add endpoint to controller
   - Serialize settings to JSON/CSV
   - Download settings file

---

## Version Info

- **Module Version**: 1.0
- **Created**: Today
- **Status**: Production Ready
- **Last Updated**: Today

---

## Support Resources

1. **API Docs**: See STORE_SETTINGS_MODULE.md
2. **Implementation**: See IMPLEMENTATION_SUMMARY.md
3. **Deployment**: See DEPLOYMENT_CHECKLIST.md
4. **Feature Status**: See FEATURE-UPDATES.md

---

**Ready to use!** 🚀
