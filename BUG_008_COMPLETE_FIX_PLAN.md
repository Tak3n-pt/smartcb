# BUG-008 COMPLETE FIX - IMPLEMENTATION PLAN

## 🎯 OBJECTIVE

Fix the infinite reconnect loop issue by adding user-configurable max reconnect attempts that synchronizes between React Native app and ESP32 firmware.

---

## 🔍 CURRENT STATE ANALYSIS

### Problems Identified:

1. **App has max attempts (3), ESP32 doesn't** → Conflict
2. **No user control** → One-size-fits-all approach
3. **No synchronization** → App and ESP32 operate independently
4. **Relay damage risk** → Infinite cycling can destroy relay

### Current Behavior:

```
Overload occurs:
├─ App: Tries 3 times, then stops
└─ ESP32: Tries FOREVER (no limit)

Result: ESP32 continues cycling after app gives up!
```

---

## 🎨 SOLUTION DESIGN

### Architecture Overview:

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                           │
│  Settings → Protection → Auto-Reconnect Configuration        │
│                                                               │
│  [Enable Auto-Reconnect Toggle]                              │
│  [Reconnect Delay: 30s slider]                               │
│  [Max Attempts: Dropdown ▼]                                  │
│    • Disabled (0)                                             │
│    • 1 attempt                                                │
│    • 3 attempts (DEFAULT) ✅                                  │
│    • 5 attempts                                               │
│    • 10 attempts                                              │
│    • Unlimited ⚠️ WARNING                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   SETTINGS STORE                             │
│  settings.reconnection = {                                    │
│    enabled: boolean,                                          │
│    delay: number,                                             │
│    maxAttempts: number  ← NEW FIELD                          │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     ESP32 API                                │
│  POST /settings                                               │
│  {                                                            │
│    "autoResetDelay": 30,                                      │
│    "maxReconnectAttempts": 3  ← NEW FIELD                    │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   ESP32 FIRMWARE                             │
│  struct Settings {                                            │
│    int autoResetDelay;                                        │
│    int maxReconnectAttempts;  ← NEW FIELD                    │
│  }                                                            │
│                                                               │
│  protectionResetAttempts counter  ← NEW COUNTER              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 DATA MODEL

### Settings Structure:

```typescript
interface Settings {
  // ... existing fields
  reconnection: {
    enabled: boolean;           // Enable/disable auto-reconnect
    delay: number;              // Seconds to wait (5-300)
    maxAttempts: number;        // NEW: -1 (unlimited), 0 (disabled), 1-100
  };
}
```

### Max Attempts Values:

| Value | Meaning | UI Display | Risk Level |
|-------|---------|------------|------------|
| **-1** | Unlimited | "Unlimited ⚠️" | 🚨 HIGH |
| **0** | Disabled | "Disabled (Manual only)" | ✅ None |
| **1** | One shot | "1 attempt" | ✅ Very Low |
| **3** | **DEFAULT** | "3 attempts (Recommended)" | ✅ Low |
| **5** | Persistent | "5 attempts" | ⚠️ Low-Medium |
| **10** | Very persistent | "10 attempts (Advanced)" | ⚠️ Medium |

---

## 🗂️ FILES TO MODIFY

### Phase 1: Type Definitions
1. `types/settings.types.ts` - Add `maxAttempts` to reconnection interface

### Phase 2: ESP32 Firmware
2. `ESP32_Simple_Working_NonBlocking.ino` - Add counter, max attempts logic

### Phase 3: React Native Backend
3. `utils/defaultSettings.ts` - Add default value (3)
4. `services/esp32Api.ts` - Add field to API calls
5. `store/useSettingsStore.ts` - Handle new field
6. `services/notificationService.ts` - Update to use dynamic max attempts

### Phase 4: React Native UI
7. `app/(tabs)/settings.tsx` - Add UI controls + warnings
8. `components/settings/ReconnectionSettings.tsx` - New component (optional)

### Phase 5: Documentation
9. `BUG_008_COMPLETE_FIX.md` - Document the complete solution
10. `TK3N.TXT` - Update session log

---

## 🔧 IMPLEMENTATION STEPS

### STEP 1: Update Type Definitions ✅ CRITICAL

**File:** `types/settings.types.ts`

**Changes:**
- Add `maxAttempts: number` to `reconnection` interface
- Document the special values (-1 = unlimited, 0 = disabled)

**Why First:**
- TypeScript will catch all places that need updates
- Compile errors guide us to what needs changing

**Testing:**
- Run `npx tsc --noEmit` to check for type errors

---

### STEP 2: Update Default Settings

**File:** `utils/defaultSettings.ts` OR `utils/mockData.ts`

**Changes:**
- Add `maxAttempts: 3` as default value
- Ensure default is safe for most users

**Why:**
- New installs need a sensible default
- 3 attempts is balanced (safe but persistent)

**Testing:**
- Check that app starts without errors
- Verify settings screen shows default value

---

### STEP 3: Update ESP32 Firmware ⚡ MOST CRITICAL

**File:** `ESP32_Simple_Working_NonBlocking.ino`

**Changes:**

1. **Add to Settings struct** (around line 40):
```cpp
struct Settings {
  float maxCurrent;
  float maxVoltage;
  float minVoltage;
  // ... existing fields
  int autoResetDelay;
  int maxReconnectAttempts;  // NEW: -1=unlimited, 0=disabled, 1-100
};
```

2. **Add attempt counter** (around line 68):
```cpp
int protectionResetAttempts = 0;  // NEW: Track auto-reconnect attempts
```

3. **Reset counter when protection triggers** (around line 408):
```cpp
if (shouldTrip && relayState) {
  // ... existing code
  protectionResetAttempts = 0;  // NEW: Reset counter on new protection event
}
```

4. **Check max attempts in auto-reconnect logic** (around line 157):
```cpp
if (currentMillis - protectionTimestamp > (settings.autoResetDelay * 1000)) {
  // NEW: Check max attempts
  if (settings.maxReconnectAttempts > 0 &&
      protectionResetAttempts >= settings.maxReconnectAttempts) {
    Serial.println("❌ Max reconnect attempts reached, manual reset required");
    // DO NOT attempt reconnect
    return;
  }

  // Check if conditions are safe
  if (isConditionsSafe()) {
    protectionResetAttempts++;  // NEW: Increment counter
    Serial.printf("🔄 Auto-reconnect attempt %d/%d\n",
                  protectionResetAttempts,
                  settings.maxReconnectAttempts);
    // ... turn relay ON
  }
}
```

5. **Reset counter on manual button press** (around line 226):
```cpp
if (digitalRead(BUTTON_PIN) == LOW) {
  // ... existing code
  protectionResetAttempts = 0;  // NEW: Manual button resets counter
}
```

6. **Add to settings GET endpoint** (around line 507):
```cpp
doc["autoResetDelay"] = settings.autoResetDelay;
doc["maxReconnectAttempts"] = settings.maxReconnectAttempts;  // NEW
```

7. **Add to settings POST endpoint** (around line 559):
```cpp
if (doc.containsKey("autoResetDelay")) {
  settings.autoResetDelay = constrain(doc["autoResetDelay"].as<int>(), 5, 300);
}
if (doc.containsKey("maxReconnectAttempts")) {  // NEW
  settings.maxReconnectAttempts = constrain(doc["maxReconnectAttempts"].as<int>(), -1, 100);
  Serial.printf("✅ Max reconnect attempts: %d\n", settings.maxReconnectAttempts);
}
```

8. **Update default initialization** (around line 40):
```cpp
Settings settings = {
  2.54,  // maxCurrent
  250.0, // maxVoltage
  180.0, // minVoltage
  // ... other fields
  30,    // autoResetDelay
  3      // maxReconnectAttempts (NEW - DEFAULT to 3)
};
```

**Why Critical:**
- Hardware must respect the limit
- Most complex changes are here
- Must handle unlimited (-1) case specially

**Testing:**
- Upload to ESP32
- Verify Serial Monitor shows counter
- Trigger protection and watch attempts
- Verify manual button resets counter

---

### STEP 4: Update ESP32 API Service

**File:** `services/esp32Api.ts`

**Changes:**

1. **Add to updateSettings() parameter** (around line 134):
```typescript
async updateSettings(settings: {
  maxCurrent?: number;
  maxVoltage?: number;
  // ... existing fields
  autoResetDelay?: number;
  maxReconnectAttempts?: number;  // NEW: Max auto-reconnect attempts
}): Promise<boolean>
```

2. **Send to ESP32** (ensure it's included in the request body)

**Why:**
- API must send the new field to ESP32
- TypeScript ensures we don't forget it

**Testing:**
- Check network logs when settings change
- Verify POST body includes maxReconnectAttempts

---

### STEP 5: Update Settings Store

**File:** `store/useSettingsStore.ts`

**Changes:**

1. **Update updateSchedule() to include new field** (around line 98):
```typescript
await api.updateSettings({
  maxCurrent: state.settings.thresholds.current.max,
  // ... existing fields
  autoResetDelay: state.settings.reconnection.delay,
  maxReconnectAttempts: state.settings.reconnection.maxAttempts  // NEW
});
```

2. **Update syncWithESP32()** (around line 170):
```typescript
const success = await api.updateSettings({
  // ... existing fields
  autoResetDelay: state.settings.reconnection.delay,
  maxReconnectAttempts: state.settings.reconnection.maxAttempts  // NEW
});
```

**Why:**
- Store must sync the new field to ESP32
- All settings updates must include it

**Testing:**
- Change settings and check ESP32 receives it
- Verify GET /settings returns the new value

---

### STEP 6: Update Notification Service

**File:** `services/notificationService.ts`

**Changes:**

1. **Remove hardcoded MAX_RECONNECT_ATTEMPTS** (line 27):
```typescript
// DELETE THIS:
// private readonly MAX_RECONNECT_ATTEMPTS = 3;

// It will be read from settings instead
```

2. **Update attemptAutoReconnect()** (around line 400):
```typescript
private attemptAutoReconnect(): void {
  console.log('🔌 Attempting automatic reconnection...');

  // Get max attempts from settings (NEW)
  const settings = useSettingsStore.getState().settings;
  const maxAttempts = settings.reconnection.maxAttempts;

  // Check if reconnect is disabled (NEW)
  if (maxAttempts === 0) {
    console.log('ℹ️ Auto-reconnect is disabled, manual reset required');
    return;
  }

  // Check max attempts (skip if unlimited = -1)
  if (maxAttempts > 0 && this.reconnectAttempts >= maxAttempts) {
    console.error(`❌ Max reconnect attempts (${maxAttempts}) reached`);
    // ... existing error handling
    return;
  }

  this.reconnectAttempts++;
  console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}${maxAttempts > 0 ? '/' + maxAttempts : ' (unlimited)'}`);

  // ... rest of method
}
```

3. **Update success notification** (around line 473):
```typescript
const maxAttempts = useSettingsStore.getState().settings.reconnection.maxAttempts;
const attemptDisplay = maxAttempts > 0 ? `${this.reconnectAttempts}/${maxAttempts}` : `${this.reconnectAttempts} (unlimited)`;

showToast.success(
  `Power has been automatically restored (Attempt ${attemptDisplay})`,
  '✅ Auto-Reconnect'
);
```

**Why:**
- App must respect user's chosen limit
- Dynamic limit instead of hardcoded
- Handle unlimited mode (-1)

**Testing:**
- Trigger protection cutoff
- Verify app respects the limit
- Try different max attempts values
- Test unlimited mode

---

### STEP 7: Update Settings UI

**File:** `app/(tabs)/settings.tsx`

**Changes:**

1. **Add Picker/Dropdown for Max Attempts**:
```typescript
<View style={styles.settingRow}>
  <Text style={styles.settingLabel}>Max Reconnect Attempts</Text>
  <Picker
    selectedValue={settings.reconnection.maxAttempts}
    onValueChange={(value) => updateReconnection({ maxAttempts: value })}
    style={styles.picker}
  >
    <Picker.Item label="Disabled (Manual only)" value={0} />
    <Picker.Item label="1 attempt" value={1} />
    <Picker.Item label="3 attempts (Recommended) ✅" value={3} />
    <Picker.Item label="5 attempts" value={5} />
    <Picker.Item label="10 attempts (Advanced)" value={10} />
    <Picker.Item label="Unlimited ⚠️ WARNING" value={-1} />
  </Picker>
</View>
```

2. **Add Warning Dialog for Unlimited Mode**:
```typescript
// Show alert when user selects unlimited
if (value === -1) {
  Alert.alert(
    '⚠️ WARNING: Unlimited Reconnect Attempts',
    'Unlimited reconnect attempts may damage your relay through excessive cycling. ' +
    'Use only for critical equipment where continuous operation is essential.\n\n' +
    'Your relay is rated for ~100,000 cycles. Rapid cycling can reduce its lifespan significantly.\n\n' +
    'Are you sure you want to enable unlimited attempts?',
    [
      { text: 'Cancel', style: 'cancel', onPress: () => {/* keep previous value */} },
      { text: 'I Understand', style: 'destructive', onPress: () => {
        updateReconnection({ maxAttempts: -1 });
      }},
    ]
  );
}
```

3. **Add Help Text**:
```typescript
<Text style={styles.helpText}>
  Controls how many times the system will try to reconnect after a protection cutoff.
  {'\n'}• Recommended: 3 attempts
  {'\n'}• Unlimited: ⚠️ May damage relay
</Text>
```

**Why:**
- User needs UI control
- Safety warning prevents misuse
- Clear labels guide users

**Testing:**
- UI renders correctly
- Picker changes value
- Warning shows for unlimited
- Setting syncs to ESP32

---

### STEP 8: Update Mock Data

**File:** `utils/mockData.ts`

**Changes:**
- Ensure default settings include `maxAttempts: 3`

**Why:**
- Demo mode needs proper defaults

---

### STEP 9: Testing Plan

#### Unit Tests:
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] App builds without errors
- [ ] ESP32 compiles without errors

#### Integration Tests:
- [ ] Change setting in UI → ESP32 receives it
- [ ] ESP32 respects max attempts
- [ ] App respects max attempts
- [ ] Unlimited mode works
- [ ] Disabled mode works
- [ ] Manual button resets counter

#### Safety Tests:
- [ ] Warning shows for unlimited mode
- [ ] Cannot accidentally enable unlimited
- [ ] Default is safe (3 attempts)

#### Edge Cases:
- [ ] What if ESP32 is offline when changing setting?
- [ ] What if setting sync fails?
- [ ] What if user changes setting during reconnect cycle?

---

## 🚨 SAFETY CONSIDERATIONS

### 1. Default to Safe Values
- Default: 3 attempts (not unlimited)
- Persist across restarts
- Clear warnings for dangerous settings

### 2. Relay Protection
- Minimum 30s between attempts
- Counter persists across reboots (store in EEPROM?)
- Manual button always resets counter

### 3. User Education
- Clear labels
- Warning dialogs
- Help text explaining risks

### 4. Fail-Safe Behavior
- If sync fails, keep existing (safe) value
- If invalid value received, use default (3)
- Log all attempts for debugging

---

## 📈 SUCCESS CRITERIA

### Must Have:
✅ User can select max attempts (0, 1, 3, 5, 10, -1)
✅ ESP32 and app both respect the limit
✅ Settings sync correctly
✅ Warning shows for unlimited mode
✅ Default is safe (3 attempts)
✅ Manual button resets counter

### Nice to Have:
- Show attempt counter in dashboard
- Show relay cycle count
- Alert when approaching relay lifecycle
- EEPROM persistence of counter

---

## 🗓️ IMPLEMENTATION ORDER

### Phase 1: Foundation (No UI changes)
1. ✅ Update types
2. ✅ Update default settings
3. ⚡ Update ESP32 firmware (CRITICAL)
4. ✅ Update API service
5. ✅ Update settings store
6. ✅ Update notification service

### Phase 2: User Interface
7. ✅ Update settings screen UI
8. ✅ Add warning dialogs

### Phase 3: Testing & Documentation
9. ✅ Test all scenarios
10. ✅ Document changes
11. ✅ Update TK3N.txt

---

## 📝 ROLLBACK PLAN

If something goes wrong:

1. **ESP32 won't boot** → Restore previous .ino file
2. **App crashes** → Revert type changes, use default value
3. **Sync fails** → App works standalone with app-side limit
4. **User confused** → Clear documentation + help text

---

## 🎯 DELIVERABLES

1. ✅ Updated type definitions
2. ✅ Modified ESP32 firmware
3. ✅ Updated API and store
4. ✅ New UI controls with warnings
5. ✅ Complete documentation
6. ✅ Test results
7. ✅ Updated TK3N.txt

---

**READY TO PROCEED WITH IMPLEMENTATION?**

This plan ensures we modify the system systematically without breaking anything.
