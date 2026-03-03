

You (the developer/admin) register the app **once** in Azure Portal. End users just click "Connect Outlook Account" and sign in with their Microsoft account — they never touch Azure.

Here's the flow:

1. **You** register a single app in Azure Portal (App registrations) with support for personal Microsoft accounts
2. **You** set the `OUTLOOK_CLIENT_ID` and `OUTLOOK_CLIENT_SECRET` env vars on your server
3. **End users** click the "Connect Outlook Account" button in the Integrations UI, get redirected to Microsoft's consent screen, sign in, and authorize your app to read their mail

The setup instructions shown in the Integrations UI (the blue "Azure App Registration Required" box) are meant for you as the server administrator, not for end users. That said, those instructions are currently visible to all users of the integrations page, which could be confusing.

Would you like me to hide those setup instructions behind an admin-only check, or perhaps only show them when the `OUTLOOK_CLIENT_ID` env var is not configured (i.e., the integration hasn't been set up yet)?