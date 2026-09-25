# Tenant app names and icons

Each tenant can give the ordering app (and the rider, POS and logistics apps) its own name and
icon. The values live in the tenant's auth-api metadata under `service_branding`, keyed by
service:

```json
"service_branding": {
  "ordering": {
    "name": "Urban Eats",
    "short_name": "Urban Eats",
    "tagline": "Urban Loft food, ordered your way",
    "icon_url": "data:image/svg+xml;base64,..."
  }
}
```

Set them in Accounts > My Organisation > Branding > App Names and Icons. auth-api validates the
entry (name 60 characters, short name 24, hex theme colour, https or uploaded icon; SVG icons are
checked for scripts and external references) and clears the shared tenant cache so the change
shows within minutes.

What picks it up in the ordering app:

| Where | Source |
|---|---|
| Browser tab title, `applicationName`, iOS home screen title | `[orgSlug]/layout.tsx` via `lib/app-branding.ts` |
| Installed app name, launcher label, theme colour | `[orgSlug]/manifest.webmanifest` |
| App icons (favicon, apple-touch, 192/512, maskable) | `[orgSlug]/app-icon/[size]`, a square PNG generated from the icon, or initials when there is none |
| Header name and logo, install prompt | `useBrandConfig` (`app_name`, `app_icon_url` from ordering-backend `/config`) |
| Sign-in page ("Continue to Urban Eats") | auth-ui login, from the OAuth `client_id` in `return_to` |

Without an entry the app is "<Business> Ordering" with the business logo, so other tenants
(alpha-china-market, sofain-limited) keep working unchanged and can pick their own names.

## Assets

- `urban-loft/urban-eats-icon.svg`: Urban Eats app icon for urban-loft (loft roofline over a
  steaming bowl, in the cafe's espresso `#3E2723` and amber `#FFC107`). Upload it as the
  ordering app icon for urban-loft with the name "Urban Eats".
