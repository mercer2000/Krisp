

Let me look at the Modal component and the NewPageSetupModal to understand the focus issue.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\Modal.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\pages\\NewPageSetupModal.tsx"
}
I see the issue. The Modal's `useEffect` on line 60-83 depends on `[open, handleKeyDown]`. The `handleKeyDown` callback depends on `onClose`. In the `NewPageSetupModal`, `onClose` is `handleClose` which is recreated every render. This causes the `useEffect` to re-run on every state change (like typing a character), and the `requestAnimationFrame` block on line 65-69 re-focuses the first focusable element (the close X button in the header) after each keystroke.

The root cause is the Modal's effect re-running its initial focus logic every time `handleKeyDown` changes identity. The fix is to only run the auto-focus on the initial open, not on every re-render.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\ui\\Modal.tsx",
  "old_string": "  // ---- Escape key --------------------------------------------------------\n  const handleKeyDown = useCallback(\n    (e: KeyboardEvent) => {\n      if (e.key === \"Escape\") {\n        e.stopPropagation();\n        onClose();\n      }\n\n      // Basic focus trap\n      if (e.key === \"Tab\" && contentRef.current) {\n        const focusable = contentRef.current.querySelectorAll<HTMLElement>(\n          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex=\"-1\"])'\n        );\n        if (focusable.length === 0) return;\n\n        const first = focusable[0];\n        const last = focusable[focusable.length - 1];\n\n        if (e.shiftKey) {\n          if (document.activeElement === first) {\n            e.preventDefault();\n            last.focus();\n          }\n        } else {\n          if (document.activeElement === last) {\n            e.preventDefault();\n            first.focus();\n          }\n        }\n      }\n    },\n    [onClose]\n  );\n\n  // ---- Side effects -------------------------------------------------------\n  useEffect(() => {\n    if (open) {\n      previouslyFocused.current = document.activeElement as HTMLElement;\n      document.addEventListener(\"keydown\", handleKeyDown);\n      // Move focus into the modal after a tick so the animation has started\n      requestAnimationFrame(() => {\n        const firstFocusable = contentRef.current?.querySelector<HTMLElement>(\n          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex=\"-1\"])'\n        );\n        firstFocusable?.focus();\n      });\n      // Prevent body scroll\n      document.body.style.overflow = \"hidden\";\n    } else {\n      document.removeEventListener(\"keydown\", handleKeyDown);\n      document.body.style.overflow = \"\";\n      previouslyFocused.current?.focus();\n    }\n\n    return () => {\n      document.removeEventListener(\"keydown\", handleKeyDown);\n      document.body.style.overflow = \"\";\n    };\n  }, [open, handleKeyDown]);",
  "new_string": "  // Use a ref for onClose so the keydown handler never goes stale\n  const onCloseRef = useRef(onClose);\n  onCloseRef.current = onClose;\n\n  // ---- Side effects -------------------------------------------------------\n  useEffect(() => {\n    if (open) {\n      previouslyFocused.current = document.activeElement as HTMLElement;\n\n      const handleKeyDown = (e: KeyboardEvent) => {\n        if (e.key === \"Escape\") {\n          e.stopPropagation();\n          onCloseRef.current();\n        }\n\n        // Basic focus trap\n        if (e.key === \"Tab\" && contentRef.current) {\n          const focusable = contentRef.current.querySelectorAll<HTMLElement>(\n            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex=\"-1\"])'\n          );\n          if (focusable.length === 0) return;\n\n          const first = focusable[0];\n          const last = focusable[focusable.length - 1];\n\n          if (e.shiftKey) {\n            if (document.activeElement === first) {\n              e.preventDefault();\n              last.focus();\n            }\n          } else {\n            if (document.activeElement === last) {\n              e.preventDefault();\n              first.focus();\n            }\n          }\n        }\n      };\n\n      document.addEventListener(\"keydown\", handleKeyDown);\n      // Move focus into the modal after a tick so the animation has started\n      requestAnimationFrame(() => {\n        const firstFocusable = contentRef.current?.querySelector<HTMLElement>(\n          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex=\"-1\"])'\n        );\n        firstFocusable?.focus();\n      });\n      // Prevent body scroll\n      document.body.style.overflow = \"hidden\";\n\n      return () => {\n        document.removeEventListener(\"keydown\", handleKeyDown);\n        document.body.style.overflow = \"\";\n      };\n    } else {\n      document.body.style.overflow = \"\";\n      previouslyFocused.current?.focus();\n    }\n  }, [open]);"
}
Now let me verify the final state of the file looks correct:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\Modal.tsx"
}
Now clean up the unused `useCallback` import:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\ui\\Modal.tsx",
  "old_string": "import React, { useCallback, useEffect, useRef } from \"react\";",
  "new_string": "import React, { useEffect, useRef } from \"react\";"
}
The fix: The `useEffect` in `Modal` previously depended on `[open, handleKeyDown]`, where `handleKeyDown` was a `useCallback` that depended on `onClose`. Since `NewPageSetupModal` passes `handleClose` (which closes over state and is recreated each render) as `onClose`, every keystroke caused the effect to re-run, which re-triggered `requestAnimationFrame` + `firstFocusable?.focus()` — stealing focus to the X button.

The fix stores `onClose` in a ref and makes the effect depend only on `[open]`, so the auto-focus and event listener setup only happen once when the modal opens, not on every re-render.