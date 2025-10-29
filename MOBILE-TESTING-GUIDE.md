# Mobile Testing Guide for Vilva Greenhouse Management

## Quick Test Checklist

### 1. Navigation (All Screens)
- [ ] Mobile menu (☰) appears on small screens
- [ ] Menu opens and closes properly
- [ ] All navigation links work
- [ ] Active page is highlighted

### 2. Dashboard
**Mobile (< 640px)**
- [ ] Stats cards show 2 per row
- [ ] Numbers are readable
- [ ] Recent activities cards stack vertically
- [ ] Tables scroll horizontally

**Tablet (640px - 1024px)**
- [ ] Stats show 4 across
- [ ] Tables show fewer columns but remain usable

**Desktop (> 1024px)**
- [ ] All columns visible
- [ ] Full layout displays properly

### 3. Greenhouses Page
**Mobile**
- [ ] Greenhouse selector buttons wrap properly
- [ ] Beds display in grid (1-2 columns)
- [ ] Bed details are readable
- [ ] Click bed to open sow crop modal
- [ ] Modal form is usable with touch

**Tablet/Desktop**
- [ ] Side-by-side bed layout appears
- [ ] Center aisle visible on large screens

### 4. Crops Page
**Mobile**
- [ ] Search bar is full width
- [ ] Filter buttons wrap or scroll
- [ ] Crop cards stack (1 per row)
- [ ] Tap card to view details
- [ ] Modals are scrollable

**Tablet**
- [ ] 2 columns of crop cards

**Desktop**
- [ ] 3 columns of crop cards

### 5. Activities Page
**Mobile**
- [ ] "Log Activity" button full width
- [ ] Table shows essential columns
- [ ] Hidden columns: Location, Variety, Details
- [ ] Swipe to see Actions column
- [ ] Modal form is touch-friendly

**Tablet/Desktop**
- [ ] All columns visible
- [ ] Table comfortable to use

### 6. Sales Page
**Mobile**
- [ ] Order form fields stack vertically
- [ ] Item inputs are large enough to tap
- [ ] Order cards are readable
- [ ] Payment modal works on small screens

**Tablet/Desktop**
- [ ] Multi-column layouts appear
- [ ] All features accessible

## Device Testing Matrix

| Device Type | Screen Size | Test Status |
|-------------|-------------|-------------|
| iPhone SE | 375x667 | ⏳ Pending |
| iPhone 12 | 390x844 | ⏳ Pending |
| Samsung Galaxy S21 | 360x800 | ⏳ Pending |
| iPad Mini | 768x1024 | ⏳ Pending |
| iPad Pro | 1024x1366 | ⏳ Pending |
| Desktop | 1920x1080 | ⏳ Pending |

## Chrome DevTools Testing

1. Open DevTools (F12)
2. Click Toggle Device Toolbar (Ctrl+Shift+M)
3. Test these presets:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Responsive (manually adjust)

## Common Issues to Watch For

### Layout Issues
- [ ] Text cutoff at edges
- [ ] Buttons too small to tap (< 44px)
- [ ] Horizontal scroll on full page (should only be on tables)
- [ ] Overlapping elements
- [ ] Modal larger than viewport

### Touch Issues
- [ ] Dropdowns hard to select
- [ ] Date pickers not working
- [ ] Buttons too close together
- [ ] Accidental clicks

### Content Issues
- [ ] Text too small to read
- [ ] Icons not visible
- [ ] Long text not truncating
- [ ] Numbers not formatting properly

## Testing Each Feature

### Sow a Crop (Mobile)
1. Navigate to Greenhouses
2. Select a greenhouse
3. Tap an available bed
4. Fill sow crop form
5. Verify keyboard doesn't cover inputs
6. Submit and check success

### Log an Activity (Mobile)
1. Navigate to Activities
2. Tap "Log Activity" button
3. Select crop from dropdown
4. Fill all fields
5. Submit and verify in list

### Create an Order (Mobile)
1. Navigate to Sales
2. Tap "+ New Order"
3. Select customer
4. Add multiple items
5. Fill payment details
6. Submit order

### View Reports (Tablet)
1. Open Dashboard
2. Scroll through reports
3. Verify tables are readable
4. Check totals calculate correctly

## Browser Compatibility

### iOS Safari
- [ ] Touch targets work
- [ ] Modals display properly
- [ ] Forms submit correctly
- [ ] Date pickers work

### Chrome Mobile
- [ ] All features functional
- [ ] Smooth scrolling
- [ ] No layout shifts

### Firefox Mobile
- [ ] Responsive layout works
- [ ] No JavaScript errors

## Performance Checks

- [ ] Page loads in < 3 seconds on 3G
- [ ] Smooth scrolling on lists
- [ ] No lag when opening modals
- [ ] Tables render quickly

## Accessibility

- [ ] Buttons have adequate touch targets (44px min)
- [ ] Text is readable (minimum 14px on mobile)
- [ ] Sufficient color contrast
- [ ] Forms work with screen readers

## Bugs to Fix

Document any issues found:

### Issue #1
**Screen:** _____
**Device:** _____
**Description:** _____
**Priority:** High / Medium / Low

### Issue #2
**Screen:** _____
**Device:** _____
**Description:** _____
**Priority:** High / Medium / Low

## Sign-off

- [ ] All critical features tested on mobile
- [ ] All critical features tested on tablet
- [ ] All critical features tested on desktop
- [ ] No blocking issues found
- [ ] Ready for production use

**Tested by:** _____________
**Date:** _____________
**Version:** v1.1.0 (Mobile Optimized)
