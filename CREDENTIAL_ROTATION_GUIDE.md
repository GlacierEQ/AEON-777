# CREDENTIAL ROTATION GUIDE - EMERGENCY PROTOCOL
## For Mac: Secure Rotation Before Using Any APIs

**Status**: 60+ API credentials exposed in plaintext. Rotation required before proceeding with federal complaint automation.

---

## PRIORITY 1: CRITICAL ROTATION (Do First)

### OpenAI (4 Keys)
**Risk**: Full ChatGPT account access, billing control, model training data access

**Steps**:
1. Go to: https://platform.openai.com/account/api-keys
2. Click "Delete" next to each key:
   - Delete key 1
   - Delete key 2
   - Delete key 3  
   - Delete key 4
3. Create new key: Click "Create new secret key"
4. Copy new key immediately (won't show again)
5. Save to secure location

**Time**: 5 minutes
**Impact**: Prevents ChatGPT account compromise

---

### GitHub (7 PATs)
**Risk**: Full repo access, deployment pipeline control, code injection

**Steps**:
1. Go to: https://github.com/settings/tokens
2. Click "Delete" next to each token:
   - Delete token 1 (repo access)
   - Delete token 2 (personal access)
   - Delete token 3-7
3. Create new token: Click "Generate new token"
   - Scope: repo (full control)
   - Scope: user (profile access)
   - Expiration: 90 days
4. Copy immediately, save to secure location

**Time**: 5 minutes per token = 35 minutes total
**Impact**: Prevents code injection, prevents deployment attacks

---

### Supabase (4 Projects - Service Role Keys)
**Risk**: Full database access, can drop tables, modify authentication

**Steps**:
Per project:
1. Go to: https://app.supabase.com/
2. Select project
3. Settings → API → Service Role Key
4. Click "Rotate" 
5. Confirm rotation (generates new key)
6. Copy new key, save to secure location

**Time**: 5 minutes per project = 20 minutes total
**Impact**: Prevents database compromise, protects user data

---

### Google / Gemini
**Risk**: Email access, cloud storage access, API quota control

**Steps**:
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Generate app password
4. Delete old passwords from settings
5. Copy new password, save to secure location

**Time**: 5 minutes
**Impact**: Prevents email/cloud compromise

---

## PRIORITY 2: HIGH ROTATION (Do Second)

### CourtListener API
**Risk**: Unauthorized case research, private filing access

**Steps**:
1. Go to: https://www.courtlistener.com/
2. Login to account
3. Profile → API Tokens
4. Click "Delete" on existing token
5. Click "Generate New Token"
6. Copy token, save to secure location

**Time**: 3 minutes

---

### Perplexity API
**Risk**: Research queries, model access, billing control

**Steps**:
1. Go to: https://www.perplexity.ai/
2. Login
3. Settings → API Keys
4. Delete old key
5. Generate new key
6. Copy, save to secure location

**Time**: 3 minutes

---

### Anthropic (Claude API)
**Risk**: Model access, billing control, custom instruction injection

**Steps**:
1. Go to: https://console.anthropic.com/
2. Login
3. API Keys → Delete current key
4. Generate new key
5. Copy, save to secure location

**Time**: 3 minutes

---

### Notion
**Risk**: Workspace access, page modification, token injection

**Steps**:
1. Go to: https://www.notion.com/
2. Settings & members → Integrations → Develop or manage integrations
3. Find existing integration
4. Regenerate token
5. Copy new token, save to secure location

**Time**: 3 minutes

---

### ClickUp
**Risk**: Task modification, workspace access, automation injection

**Steps**:
1. Go to: https://app.clickup.com/
2. Settings (gear icon) → Personal Settings → Apps
3. Find ClickUp API token
4. Delete token
5. Generate new token (copy immediately)
6. Save to secure location

**Time**: 3 minutes

---

## PRIORITY 3: MEDIUM ROTATION (Do Third)

### Slack (If Applicable)
### Mem0 API (Memory Integration)
### Supermemory API  
### Groq
### Letta
### Other Services (40+ remaining)

**Steps** (general for all):
1. Locate service dashboard
2. Find "API Keys" or "Authentication" section
3. Delete or revoke current key
4. Generate new key
5. Copy immediately
6. Save to secure location

**Total time for all 40+**: 30-60 minutes

---

## SECURE STORAGE METHOD

**Option 1: Apple Keychain (Recommended)**
1. Open Keychain Access (Mac)
2. Create new password entry for each service
3. Name: "[Service] API Key - [Date]"
4. Keychain automatically encrypts

**Option 2: 1Password** (If you have it)
1. Create vault
2. New password item for each credential
3. Name, URL, API key
4. 1Password encrypts at rest

**Option 3: MacOS Notes with FileVault**
1. Open Notes
2. Create "API Keys - Rotated [Date]"
3. Add each key with service name
4. **ONLY if FileVault encryption is ON**
5. Delete after moving to Keychain

---

## DO NOT

❌ Save credentials in .env files (plaintext)
❌ Save credentials in GitHub (repo access = permanent)
❌ Email credentials to yourself
❌ Use same password/key for multiple services
❌ Share rotation list with anyone

---

## AFTER ROTATION: RECONNECT TO AGENTS

Once all credentials rotated:

1. Update connection credentials in Tasklet UI
2. Re-authorize connections that require manual re-auth
3. Re-activate tools that depend on API keys
4. Test each connection with sample API call

---

## ESTIMATED TOTAL TIME

```
Priority 1 (Critical): 65 minutes
Priority 2 (High): 15 minutes
Priority 3 (Medium): 45 minutes
Secure storage + reconnection: 20 minutes

TOTAL: ~2.5 hours
```

---

## AFTER THIS IS DONE

You can safely:
- ✅ Use federal complaint automation
- ✅ Connect to court databases
- ✅ Access research APIs
- ✅ File documents securely
- ✅ Proceed with full execution plan

---

**Status**: Rotation guide ready. Do this first on Mac, then proceed with federal complaint filing.
