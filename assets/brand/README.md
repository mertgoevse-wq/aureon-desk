# Aureon Desk — Brand Assets

Original brand identity for Aureon Desk. All assets are proprietary and designed specifically for this project.

## Usage

### SVGs (Source of Truth)

| File | Description | Usage |
|------|-------------|-------|
| `aureon-icon.svg` | Square app icon with rounded corners | App icon source, `.ico` generation |
| `aureon-mark.svg` | Just the abstract "A" mark | Favicon, small badges, tray icon |
| `aureon-wordmark.svg` | Mark + "Aureon Desk" text | Sidebar header, inline branding |
| `aureon-logo.svg` | Full logo with mark + wordmark + tagline | README header, documentation, splash |

### Raster Icons (Generated)

Run `node scripts/generate-icons.mjs` to generate PNG and ICO files from the mark:

| File | Size | Usage |
|------|------|-------|
| `build/icon.ico` | Multi-size ICO | Windows app icon, installer |
| `build/icon.png` | 512px | General use, README |
| `build/icon-{size}.png` | 16–512px | Various contexts |

## Brand Guidelines

### Colors
- **Background**: `#FAF8F5` (Warm Ivory)
- **Primary Accent**: `#C75B39` (Warm Terracotta)
- **Secondary Accent**: `#E8A45C` (Warm Amber)
- **Text**: `#2C2416` (Warm Dark Brown)
- **Text Secondary**: `#6B5E4A` (Warm Muted)

### Mark
The Aureon mark is an abstract "A" with subtle neural node dots and a circular aureole. Do not:
- Rotate or stretch the mark
- Change the mark colors
- Add effects (shadows, glows, gradients)
- Place on non-brand backgrounds without adequate contrast

### Typography
- **Display**: Crimson Text (serif)
- **Body**: Inter (sans-serif)
- **Mono**: JetBrains Mono

---

*These assets were designed for Aureon Desk. No proprietary AI company branding was referenced or copied.*
