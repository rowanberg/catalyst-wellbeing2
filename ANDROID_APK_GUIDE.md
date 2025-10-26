# 📱 Generate Android APK from PWA

Complete guide to convert your Catalyst PWA into an Android APK file.

---

## 🎯 **3 Methods to Generate APK**

| Method | Difficulty | Time | Best For |
|--------|-----------|------|----------|
| **PWABuilder** | ⭐ Easy | 5 min | Quick testing, no coding |
| **Bubblewrap** | ⭐⭐ Medium | 15 min | Official Google method |
| **Capacitor** | ⭐⭐⭐ Hard | 30+ min | Custom native features |

---

## 🚀 **METHOD 1: PWABuilder (RECOMMENDED - Easiest)**

### **Step 1: Deploy Your PWA**
Your PWA must be live on HTTPS first.

```bash
# Deploy to Netlify/Vercel or any hosting
npm run build

# Or test with ngrok temporarily:
npm start
ngrok http 3000
```

### **Step 2: Use PWABuilder**

1. **Go to:** https://www.pwabuilder.com/
2. **Enter your URL:** `https://your-domain.com` or ngrok URL
3. Click **"Start"**
4. Wait for analysis to complete
5. Click **"Package For Stores"**
6. Select **"Android"**
7. Click **"Generate Package"**

### **Step 3: Download & Configure**

1. Fill in app details:
   - **App Name:** Catalyst Wellbeing
   - **Package ID:** com.catalystwells.app
   - **Version:** 1.0.0
   - **Icon:** Upload your `public00-00.png`

2. **Signing Options:**
   - **Option A:** Use existing keystore (if you have one)
   - **Option B:** Let PWABuilder generate one (easier)

3. Click **"Generate"**
4. Download the `.apk` file

### **Step 4: Test APK**

```bash
# Install on Android device via USB
adb install catalyst-app.apk

# Or send APK to phone and install manually
```

**✅ Done! Your APK is ready.**

---

## ⚙️ **METHOD 2: Bubblewrap (Google's Official Tool)**

### **Prerequisites**
```bash
# Install Node.js (already have)
# Install Java JDK 17+
# Install Android SDK

# Install Bubblewrap
npm install -g @bubblewrap/cli
```

### **Step 1: Initialize Project**

```bash
# Navigate to your project
cd c:\projects\kids\catalyst

# Initialize Bubblewrap (replace URL with your deployed URL)
bubblewrap init --manifest=https://your-domain.com/manifest.json
```

**Answer the prompts:**
- App name: `Catalyst Wellbeing`
- Package name: `com.catalystwells.app`
- Host: `your-domain.com`
- Start URL: `/`
- Theme color: `#3b82f6`
- Navigation color: `#ffffff`

### **Step 2: Configure Build**

```bash
# Generate signing key (first time only)
bubblewrap build --generateKey

# Or use existing keystore
bubblewrap build --keystore=path/to/keystore.jks
```

### **Step 3: Build APK**

```bash
# Build release APK
bubblewrap build

# APK will be in: android/app/build/outputs/apk/release/
```

### **Step 4: Test & Install**

```bash
# Install on connected Android device
adb install android/app/build/outputs/apk/release/app-release.apk

# Or copy to phone manually
```

---

## 🔧 **METHOD 3: Capacitor (Advanced)**

### **Step 1: Install Capacitor**

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# Initialize Capacitor
npx cap init
```

**Enter details:**
- App name: `Catalyst Wellbeing`
- App ID: `com.catalystwells.app`
- Web directory: `out` (if using static export) or `.next`

### **Step 2: Add Android Platform**

```bash
# Add Android platform
npx cap add android

# Copy web assets
npm run build
npx cap copy
npx cap sync
```

### **Step 3: Open in Android Studio**

```bash
# Open Android Studio
npx cap open android
```

### **Step 4: Build APK in Android Studio**

1. Android Studio opens automatically
2. Wait for Gradle sync to complete
3. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. Wait for build to complete
5. Click **"locate"** to find APK file

---

## 📋 **Quick Comparison**

### **PWABuilder (Best for most users)**
✅ No coding required  
✅ Generates APK in 5 minutes  
✅ Auto-updates from web  
✅ Works with any PWA  
❌ Limited customization  

### **Bubblewrap**
✅ Official Google tool  
✅ Uses Trusted Web Activity (TWA)  
✅ Full screen app experience  
✅ Command-line based  
❌ Requires Android SDK setup  

### **Capacitor**
✅ Full native feature access  
✅ Custom plugins available  
✅ Professional development  
❌ Steeper learning curve  
❌ Requires Android Studio  

---

## 🔑 **Signing Your APK (Important for Production)**

### **Generate Keystore**

```bash
# Windows (using Java keytool)
keytool -genkey -v -keystore catalyst-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias catalyst

# You'll be asked:
# - Password (remember this!)
# - Name, Organization, etc.
```

### **Keep Your Keystore SAFE!**
- ⚠️ **BACKUP** `catalyst-release.jks` and password
- Never lose it - you can't update your app without it
- Don't commit to GitHub

---

## 🎨 **Customize Your APK**

### **Splash Screen**

Create `android/app/src/main/res/drawable/splash.png` (2732x2732)

### **App Icon**

Your `public00-00.png` is already set, but you can customize per density:
- `mipmap-mdpi` → 48x48
- `mipmap-hdpi` → 72x72
- `mipmap-xhdpi` → 96x96
- `mipmap-xxhdpi` → 144x144
- `mipmap-xxxhdpi` → 192x192

### **Android Permissions**

Add to `AndroidManifest.xml` if needed:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## 🧪 **Test Your APK**

### **Install on Physical Device**

```bash
# Enable USB debugging on phone
# Connect via USB
adb devices

# Install APK
adb install catalyst-app.apk
```

### **Test Offline Mode**

1. Open app
2. Login and navigate around
3. Turn on airplane mode
4. Navigate dashboards - should work!
5. Submit a form - should queue
6. Turn off airplane mode - should sync

---

## 📤 **Distribute Your APK**

### **Option 1: Google Play Store**

1. Go to https://play.google.com/console
2. Create new app
3. Fill in store listing details
4. Upload your APK or AAB
5. Set pricing (free)
6. Submit for review

**Requirements:**
- Privacy policy URL
- Content rating questionnaire
- Screenshots (min 2)
- Feature graphic (1024x500)

### **Option 2: Direct Distribution**

1. Upload APK to your server
2. Share download link
3. Users need to enable "Install from unknown sources"

### **Option 3: Beta Testing**

Use Google Play Console's internal testing:
1. Upload APK
2. Add testers' email addresses
3. Share test link

---

## 🚀 **FASTEST PATH (For You Right Now)**

### **Step-by-Step**

```bash
# 1. Make sure your app is running
npm run dev
# Running on http://localhost:3000

# 2. Use ngrok to expose it temporarily
# Download from: https://ngrok.com/download
ngrok http 3000
# Copy the https URL (e.g., https://abc123.ngrok.io)

# 3. Go to PWABuilder
# Visit: https://www.pwabuilder.com/
# Enter your ngrok URL
# Click "Start"

# 4. Generate APK
# Click "Package For Stores" → Android
# Fill in app details
# Click "Generate"
# Download APK

# 5. Install on phone
# Transfer APK to phone
# Enable "Install unknown apps"
# Install and test!
```

**⏱️ Total time: ~10 minutes**

---

## ⚠️ **Common Issues**

### **Issue: "App not installed"**
**Solution:**
- Uninstall previous version first
- Check signature matches (use same keystore)
- Enable "Unknown sources" in settings

### **Issue: APK won't build**
**Solution:**
```bash
# Clean build
rm -rf android/build
bubblewrap build --clean
```

### **Issue: Icons not showing**
**Solution:**
- Use PNG format (not SVG)
- Square dimensions (512x512)
- No transparency for splash

---

## 📊 **APK Size Optimization**

Your APK will be ~5-10 MB for TWA/PWABuilder approach.

To reduce size:
- Use WebP images instead of PNG
- Enable code splitting
- Remove unused dependencies
- Use ProGuard (Bubblewrap/Capacitor)

---

## 🎯 **What Happens After APK Install?**

1. **First Launch:** App loads your PWA from URL
2. **Service Worker:** Caches assets for offline
3. **Updates:** Auto-updates from web (no new APK needed!)
4. **Offline:** Works from cache
5. **Native Feel:** Runs in full screen, no browser UI

---

## 📚 **Resources**

- **PWABuilder:** https://www.pwabuilder.com/
- **Bubblewrap Docs:** https://github.com/GoogleChromeLabs/bubblewrap
- **Capacitor Docs:** https://capacitorjs.com/
- **Play Console:** https://play.google.com/console

---

## ✅ **Quick Checklist**

Before generating APK:
- [ ] PWA deployed on HTTPS
- [ ] Manifest.json valid
- [ ] Service worker registered
- [ ] Icons all present (192, 512, apple)
- [ ] App tested in browser
- [ ] Offline mode working

For Play Store:
- [ ] Privacy policy URL
- [ ] App screenshots (min 2)
- [ ] Feature graphic (1024x500)
- [ ] Store description written
- [ ] Content rating completed
- [ ] Signed with release keystore

---

## 🎉 **You're Ready!**

Start with **PWABuilder** - it's the easiest and fastest way to get your APK.

**Your app already has:**
- ✅ Valid manifest.json
- ✅ Service worker
- ✅ All required icons
- ✅ Offline support
- ✅ PWA best practices

**Just needs:**
1. Deploy to HTTPS (or use ngrok)
2. Run through PWABuilder
3. Download APK
4. Install & test!

---

**Last Updated:** 2025-10-20  
**Version:** 1.0.0
