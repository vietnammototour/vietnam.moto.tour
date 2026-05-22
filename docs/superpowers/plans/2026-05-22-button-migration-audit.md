# Admin Raw `<button>` Migration Audit

Generated: 2026-05-22
Branch: feat/button-component-unification
Total raw buttons: 18

---

### src/pages/admin/tours/archive.tsx

- `src/pages/admin/tours/archive.tsx:124` — "Restore" tour from archive — `secondary`
- `src/pages/admin/tours/archive.tsx:131` — "Delete" permanently hard-delete tour — `danger`

### src/pages/admin/destinations/archive.tsx

- `src/pages/admin/destinations/archive.tsx:121` — "Restore" destination from archive — `secondary`
- `src/pages/admin/destinations/archive.tsx:128` — "Delete" permanently hard-delete destination (disabled when tours > 0) — `danger`

### src/pages/admin/destinations/index.tsx

- `src/pages/admin/destinations/index.tsx:129` — "Archive" destination — `danger`

### src/pages/admin/roles/index.tsx

- `src/pages/admin/roles/index.tsx:83` — "delete" role (inline text-style action in table row, uses `text-error hover:underline` styling) — `danger`

### src/pages/admin/users/index.tsx

- `src/pages/admin/users/index.tsx:104` — "delete" user (inline text-style action in table row, hidden for own account, uses `text-error hover:underline` styling) — `danger`

### src/components/Admin/tabs/PerksTab/PerkChip.tsx

- `src/components/Admin/tabs/PerksTab/PerkChip.tsx:42` — "✕" remove perk chip; aria-label="Remove"; icon-only inline action — `secondary`

### src/components/Admin/UserForm/TeamPhotoPicker.tsx

- `src/components/Admin/UserForm/TeamPhotoPicker.tsx:42` — "removeImage" (t key) — inline text link to clear selected photo, uses `text-error hover:underline` styling — `link`
- `src/components/Admin/UserForm/TeamPhotoPicker.tsx:54` — image thumbnail picker inside modal grid; click selects image and closes modal; no visible text label — `secondary`

### src/components/Admin/AdminLayout/AdminLayout.tsx

- `src/components/Admin/AdminLayout/AdminLayout.tsx:105` — "Logout" sidebar footer action; calls `signOut`; inline text-style — `link`

### src/components/Admin/AdminBreadcrumbs/AdminBreadcrumbs.tsx

- `src/components/Admin/AdminBreadcrumbs/AdminBreadcrumbs.tsx:91` — pencil icon edit-in-place toggle for an editable breadcrumb segment; aria-label="Edit {fieldLabel}"; icon-only — `secondary`

### src/components/Admin/TranslationEditor/TranslationEditor.tsx

- `src/components/Admin/TranslationEditor/TranslationEditor.tsx:84` — namespace sidebar tab switcher; sets `activeNamespace`; renders one button per namespace — `secondary`
- `src/components/Admin/TranslationEditor/TranslationEditor.tsx:120` — "Save N changes" primary CTA; conditionally shown when `modified.size > 0`; styled with `bg-primary` — `primary`

### src/components/Admin/ImageCollectionEditor/SortableImageCard.tsx

- `src/components/Admin/ImageCollectionEditor/SortableImageCard.tsx:38` — drag handle for dnd-kit sortable list; spreads `{...attributes} {...listeners}` from `useSortable`; aria-label="drag handle" — **EXCEPTION**: must remain raw `<button>` — dnd-kit requires spreading `attributes` and `listeners` directly onto a DOM element; Button component does not forward these arbitrary dnd-kit props.

### src/components/Admin/CardImagePreview/CardImagePreview.tsx

- `src/components/Admin/CardImagePreview/CardImagePreview.tsx:91` — "Small" card size toggle button (segmented control left segment); sets size to `'small'` — `secondary`  
  TODO: these two buttons together form a two-segment toggle — consider using `<SegmentedControl>` instead of two `<Button secondary>` once migrated.
- `src/components/Admin/CardImagePreview/CardImagePreview.tsx:102` — "Big" card size toggle button (segmented control right segment); sets size to `'large'` — `secondary`  
  TODO: same as above — pair should become `<SegmentedControl>` post-migration.

### src/components/Admin/DestinationHighlights/DestinationHighlights.tsx

- `src/components/Admin/DestinationHighlights/DestinationHighlights.tsx:137` — "Delete" highlight item inline text action; uses `text-red-500 hover:underline` — `danger`

---

## Summary

| Variant   | Count  |
| --------- | ------ |
| danger    | 7      |
| primary   | 1      |
| secondary | 7      |
| link      | 2      |
| EXCEPTION | 1      |
| **Total** | **18** |

## Exceptions

- `SortableImageCard.tsx:38` — dnd-kit drag handle must remain raw `<button>`; spreads `attributes` + `listeners` from `useSortable` which Button does not forward.

## TODOs

- `CardImagePreview.tsx:91` + `:102` — after migrating to `<Button secondary>`, evaluate replacing the pair with the existing `<SegmentedControl>` UI primitive.
