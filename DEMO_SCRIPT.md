# GigShield AI - 2 Minute Demo Script

## Total Duration: 2 minutes (120 seconds)

---

## SECTION 1: REGISTRATION (30 seconds)
**URL:** `http://localhost:3000/register`

### Steps:
1. **Say:** "First, let's create a new worker account with GigShield AI"
2. **Fill Form:**
   - Name: `Rahul Kumar`
   - Email: `rahul@gmail.com`
   - Password: `Password123`
   - Location: `Koramangala,Bangalore` ⭐ (This has safe zone discount!)
   - Platform: `Zomato`
   - UPI: `9876543210@okhdfcbank`
3. **Click:** "Register"
4. **Wait:** Page redirects to Dashboard
5. **Say:** "Account created! Now let's see the insurance protection."

**Timing:** 30 seconds (Registration form filling and redirect)

---

## SECTION 2: POLICY & PREMIUM (30 seconds)
**URL:** `http://localhost:3000/policy`

### Show Safe Zone Discount:
1. **Say:** "GigShield AI automatically detects safe zones and gives ₹2 discount!"
2. **Location Values to Show:**
   - **Dangerous Zone:** `Bangalore North` → Premium: **₹630/week**
   - **Safe Zone:** `Koramangala,Bangalore` → Premium: **₹628/week** ⭐ (-₹2 discount)
   - Switch between these to show the difference
3. **Say:** "See? Koramangala is a safe zone, so workers automatically get a discount!"

### Zone Checker (if time):
4. **Optional:** Use "Zone Checker" at bottom to verify other cities:
   - Type: `Whitefield` → Shows "✅ Safe Zone - Get ₹2 Discount"
   - Type: `Electronic City` → Shows "⚠️ Danger Zone - No Discount"

**Timing:** 30 seconds (Location switching + discount comparison)

---

## SECTION 3: DYNAMIC PRICING (40 seconds)
**URL:** `http://localhost:3000/policy` (same page, scroll down)

### Coverage Selection Slider:
1. **Say:** "Workers can choose how much hourly income they want to protect"
2. **Show Slider Value Changes:**
   - **Minimum:** 25 hours/week
     - Base Premium: ₹250
     - Show: "Protects basic work hours"
   
   - **Mid Point:** 50 hours/week
     - Base Premium: ₹500
     - Show: "Balanced coverage"
   
   - **Maximum:** 100 hours/week
     - Base Premium: **₹1000**
     - Show: "Maximum protection for full-time gig workers"

3. **Say:** "The more hours protected, the higher the premium. Workers choose based on their needs."
4. **Final Selection:** Set slider to **50 hours** → Premium shows **₹500** (or ₹498 if safe zone applied)

**Timing:** 40 seconds (Show slider movement + premium changes)

---

## SECTION 4: CLAIMS MANAGEMENT (20 seconds) ⭐ CRITICAL
**URL:** `http://localhost:3000/dashboard`

### Auto-Approved Claims Demo:
1. **Say:** "When environmental damage happens, GigShield auto-approves claims instantly. Watch:"
2. **Click TEST CLAIM BUTTON:** 🌧️ **Rainfall**
   - **Expected Result:**
     - ✅ Success Message: **"Claim Approved. Funds transferred to your UPI."** (green box)
     - Claim Amount: **₹300**
     - Status: **Approved**
   - **Say:** "Look! Claim was auto-approved and ₹300 transferred instantly to the UPI!"

3. **Wait 2 seconds** - Then click another button
4. **Click TEST CLAIM BUTTON:** 💨 **Pollution**
   - **Expected Result:**
     - ✅ Success Message appears
     - Claim Amount: **₹250**
   - **Say:** "Another trigger - another instant payout. No manual review. No delays."

5. **Check Recent Claims Table:**
   - Should see both claims listed:
     - Row 1: | Rainfall | ₹300 | Approved | [Today's Date] |
     - Row 2: | Pollution | ₹250 | Approved | [Today's Date] |
   - **Say:** "All claims logged and tracked in real-time"

**Timing:** 20 seconds (Click 2 buttons + show success messages + table)

---

## SECTION 5: OUTRO (5 seconds)
**Say:** 
"GigShield AI uses parametric insurance + AI to give gig workers instant protection. No paperwork, no delays, no rejections. When environmental disasters hit, payouts happen automatically to your UPI. That's zero-touch claims in action."

**Timing:** 5 seconds (Narration only)

---

## VALUES SUMMARY FOR QUICK REFERENCE

| Item | Value |
|------|-------|
| **Test User Name** | Rahul Kumar |
| **Test Email** | rahul@gmail.com |
| **Test Password** | Password123 |
| **Test Location** | Koramangala,Bangalore |
| **Test Platform** | Zomato |
| **Test UPI** | 9876543210@okhdfcbank |
| **Safe Zone Premium** | ₹628/week (Koramangala) |
| **Danger Zone Premium** | ₹630/week (Bangalore North) |
| **Safe Zone Discount** | ₹2 |
| **Rainfall Claim Amount** | ₹300 |
| **Pollution Claim Amount** | ₹250 |
| **Heat Claim Amount** | ₹200 |
| **Congestion Claim Amount** | ₹150 |
| **Min Coverage Hours** | 25 hours/week |
| **Max Coverage Hours** | 100 hours/week |
| **Demo Duration** | 2 minutes (120 sec) |

---

## EQUIPMENT NEEDED
- ✅ Screen recording software (OBS, Loom, or Snagit)
- ✅ Microphone for narration
- ✅ Zoom level: 125% (for better visibility)
- ✅ Both servers running:
  - Backend: `cd backend && npm start` (Port 5000)
  - Frontend: `cd frontend && npm start` (Port 3000)

---

## CRITICAL CHECKS BEFORE DEMO

1. **Servers Running:**
   ```bash
   # Terminal 1 - Backend
   cd c:\Users\sinch\Downloads\GigSheild-AI\GigSheild-AI\backend
   npm start
   
   # Terminal 2 - Frontend
   cd c:\Users\sinch\Downloads\GigSheild-AI\GigSheild-AI\frontend
   npm start
   ```

2. **Test Claims Message:** 
   - ✅ Click 🌧️ button on dashboard
   - ✅ Green success message appears: "✅ Claim Approved. Funds transferred to your UPI."
   - ✅ Wait 5 seconds (message auto-disappears)

3. **Test Recent Claims Table:**
   - ✅ Navigate to Dashboard
   - ✅ Click 2+ claim buttons
   - ✅ Table shows new claims below

4. **Firefox/Chrome DevTools:** Keep F12 open during recording (optional, for debugging if needed)

---

## SCRIPT NARRATION (Copy-Paste Ready)

**[Section 1 - 0:00-0:30]**
"GigShield AI protects gig workers from environmental disasters. Let me register a new worker account. I'll fill in basic details and location - Koramangala in Bangalore - which is in a safe zone."

**[Section 2 - 0:30-1:00]**
"Notice: Koramangala gets a ₹2 discount compared to dangerous zones. This safe zone detection is automatic. Our AI maps safer areas and rewards workers with lower premiums. I can also check any city's safety status using the Zone Checker."

**[Section 3 - 1:00-1:40]**
"Workers choose their coverage level. This slider lets them protect 25 to 100 work hours per week. More hours = more premium, but maximum protection. Let me set this to 50 hours for balanced coverage."

**[Section 4 - 1:40-2:00]**
"Here's the magic: parametric triggers. When environmental damage happens - heavy rain, pollution, extreme heat, or traffic - claims auto-approve instantly. Watch this. [Click rainfall button] ₹300 transferred immediately to the UPI. No paperwork, no delays, no rejection. This is zero-touch claims."

**[Section 5 - 2:00]**
"GigShield AI: Instant protection for gig workers 24/7."

---

## TROUBLESHOOTING

### If success message doesn't appear:
1. Check browser console (F12)
2. Verify backend is running: `http://localhost:5000/api/claims/auto-approve` 
3. Check recent claims table updated instead

### If Recent Claims table is empty:
1. Refresh browser (Ctrl+R)
2. Re-login if needed
3. Click claim button again
4. Wait 2 seconds for table to update

### If servers won't start:
```bash
# Kill all node processes
taskkill /IM node.exe /F

# Then restart both servers
# Terminal 1: cd backend && npm start
# Terminal 2: cd frontend && npm start
```

---

## RECORDING TIPS

1. **Practice once** - Do full run-through without recording
2. **Clear browser cache** - Ctrl+Shift+Delete to clear cached data
3. **Start fresh window** - Open Incognito/Private mode
4. **Mute notifications** - Disable all alerts
5. **Test audio** - Record first 10 seconds separately
6. **Frame the demo** - Show URL bar and full page
7. **Speak clearly** - Pause between sections for emphasis
8. **Demo date:** April 4, 2026 (before deadline)

