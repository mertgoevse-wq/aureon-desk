# Vendor Assets Directory

This directory contains official vendor brand assets (logos, icons) that are:
1. Properly licensed for use in desktop software
2. Sourced from the vendor's official brand guidelines
3. Used only where neutral Lucide icons are insufficient
4. Never modified, recolored, or altered from their official form

## Current Status

**No vendor assets are currently loaded.** All connectors use neutral Lucide icons with descriptive text labels. This is by design — it avoids:
- Trademark violations
- Implied partnerships or endorsement
- Broken/missing images at runtime
- Legal complexity around brand asset usage

## Adding a Vendor Asset

If a vendor asset is needed:

1. **Verify license**: Confirm the asset is licensed for third-party desktop software use
2. **Download official asset**: From the vendor's official brand/press kit
3. **Place here**: Copy the asset to this directory
4. **Add attribution**: Create a `VENDOR_ATTRIBUTION.md` in this directory documenting:
   - Asset filename
   - Vendor name
   - Source URL (official brand kit)
   - License type and terms
   - Date acquired
   - Any restrictions
5. **Add to public/vendor/**: Copy to `public/vendor/` for renderer access
6. **Update ConnectorIcon**: Add the official asset path to the `getOfficialAssetPath()` function

## Policy Reference

See `docs/BRAND_AND_VENDOR_LOGO_POLICY.md` for the full brand and vendor logo policy.
