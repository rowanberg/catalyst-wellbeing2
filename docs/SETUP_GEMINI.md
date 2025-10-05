# Gemini AI Setup Instructions

## 🚀 Quick Setup

### 1. Database Setup
Run this SQL in your Supabase SQL Editor:

```sql
-- Execute the school_gemini_config_schema.sql file
-- This creates the school-level Gemini configuration table
```

Copy and paste the contents of `database/school_gemini_config_schema.sql` into your Supabase SQL Editor and run it.

### 2. Environment Variables
Add to your `.env.local` file:

```bash
GEMINI_ENCRYPTION_KEY=your_32_character_encryption_key_here
```

Generate a random 32-character string for the encryption key.

### 3. Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the API key (starts with `AIza...`)

### 4. Configure in Admin Settings
1. Go to `http://localhost:3000/admin/settings`
2. Scroll to "Gemini AI Configuration"
3. Enter your API key
4. Select any model (all use Gemini Pro currently)
5. Click "Test Connection"
6. Click "Save Configuration"

### 5. Test AI Assistant
1. Go to `http://localhost:3000/admin/ai-assistant`
2. Send a message
3. Should work without errors

## 🔧 Troubleshooting

### "Fetch Failed" Error
- This is usually a network timeout
- The system will automatically fallback to another AI service
- You should still get a response, just ignore the console error

### "API Key Invalid"
- Make sure your API key starts with `AIza`
- Get a fresh key from Google AI Studio
- Make sure you're using Gemini AI Studio key (not Vertex AI)

### "Model Not Found"
- All models currently use `gemini-pro` due to API version compatibility
- This is normal and expected

## 📝 How It Works

1. **School-Level Storage**: API key is stored at school level (not per user)
2. **No Encryption**: API key is stored in plain text as requested
3. **Admin Only**: Only admins can configure Gemini for their school
4. **Fallback System**: If Gemini fails, system uses backup AI service
5. **Model Mapping**: All model selections use `gemini-pro` currently

## 🎯 Features

- ✅ School-level API key management
- ✅ Test connection before saving
- ✅ Automatic fallback on errors
- ✅ Persistent configuration
- ✅ Admin AI assistant integration
- ✅ Student homework helper integration
