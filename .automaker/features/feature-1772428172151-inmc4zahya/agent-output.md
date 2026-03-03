

Let me check the current state of the email detail page to see what the previous agent already did.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\[id]\\page.tsx"
}
The "Open in Outlook" link has already been implemented by the previous agent. Looking at lines 154-168, the feature is complete:

- It conditionally renders when `email.web_link` exists
- Opens in a new tab with `target="_blank"` and `rel="noopener noreferrer"`
- Has an external link icon and "Open in Outlook" text
- Styled as a bordered button in the sticky header, right-aligned next to "Back to Inbox"

Let me quickly verify that `web_link` is on the `EmailDetail` type.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\email.ts"
}
This is already done. The previous agent fully implemented the "Open in Outlook" feature:

1. **`types/email.ts:94`** - `web_link: string | null` is on the `EmailDetail` type
2. **`app/(app)/inbox/[id]/page.tsx:154-168`** - The "Open in Outlook" button renders in the header when `web_link` is present, opening the OWA link in a new tab

No further changes needed.