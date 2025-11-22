---
description: How to deploy Supabase Edge Functions
---

To deploy specific functions to the Catalyst project:

1. Run the deploy command with the project reference:

```bash
supabase functions deploy intelligent-ai-router ai-homework-chat --project-ref fsvuhhticbfjftnwzsue --no-verify-jwt
```

**Note:**
- `fsvuhhticbfjftnwzsue` is the project ID for `catalyst-wellbeing`.
- `--no-verify-jwt` is often needed if you encounter JWT verification issues during deployment.
- You can add more function names to the list to deploy them simultaneously.
