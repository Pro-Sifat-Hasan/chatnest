# ChatNest

<p align="center">
  <img src="https://i.ibb.co.com/ts1T0q7/chatnest.jpg" alt="ChatNest" width="400">
</p>

A lightweight, customizable AI chat widget. Drop it into any website in minutes.

---

## Installation

**CDN**
```html
<script src="https://cdn.jsdelivr.net/npm/chatnest@3.4.5/dist/chatnest.min.js"></script>
```

**npm**
```bash
npm install chatnest
```
```js
import Chatnest from 'chatnest';
```

---

## Quick Start

```html
<script src="https://cdn.jsdelivr.net/npm/chatnest@3.4.5/dist/chatnest.min.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    new Chatnest({
      botName: 'Support Bot',
      apiEndpoint: 'https://your-api.com/chat',
      primaryColor: '#0084ff'
    });
  });
</script>
```

---

## Configuration

### Core

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `botName` | `string` | `'Chat Assistant'` | Name shown in the header |
| `botImage` | `string` | default avatar | Bot avatar URL |
| `botSubname` | `string` | `null` | Sub-label below the bot name |
| `showBotSubname` | `boolean` | `true` | Show/hide `botSubname` |
| `greeting` | `string` | `'Hello! How can I help you today?'` | Opening message |
| `placeholder` | `string` | `'Type your message here...'` | Input placeholder text |
| `primaryColor` | `string` | `'#0084ff'` | Accent color — hex or CSS gradient |
| `fontSize` | `number\|string` | `14` | Message font size in px (14–25) |
| `width` | `string` | `'400px'` | Widget width (300–600px) |
| `height` | `string` | `'600px'` | Widget height (400–800px) |
| `position` | `string` | `'bottom-right'` | `bottom-right` `bottom-left` `bottom-center` `top-right` `top-left` |
| `theme` | `string` | `'light'` | `'light'` `'dark'` `'system'` |

### API

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiEndpoint` | `string` | `'http://localhost:7000/chat'` | Chat endpoint URL |
| `apiKey` | `string` | `''` | Bearer token added to `Authorization` header |
| `apiHeaders` | `object` | `{ 'Content-Type': 'application/json' }` | Extra request headers |
| `apiMethod` | `string` | `'POST'` | HTTP method |
| `apiTimeout` | `number` | `30000` | Request timeout in ms |
| `apiRequestFormat` | `object` | `{ query, userId, domain }` | Map request field names to what your API expects |
| `apiResponseFormat` | `object` | `{ response, products, productItem }` | Map response field names from your API |
| `apiDataFormat` | `string` | `'json'` | `'json'` or `'form-data'` |
| `useMultipartFormData` | `boolean` | `true` | Use multipart encoding for file uploads |
| `userId` | `string\|function\|null` | `null` | Override the `user_id` sent on every API call. Pass a static string, a function `(userManager) => string`, or `null` to use the auto-generated ID. If `nativeForm.useEmailAsUserId` is `true` the submitted email takes over automatically after form submission. |
| `transformResponse` | `function` | `null` | Transform the raw API response before display |
| `productInjectionMarker` | `string\|array` | see below | Text marker(s) after which the product carousel is inserted |

### Chat Behavior

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableHistory` | `boolean` | `true` | Persist chat in localStorage |
| `maxHistoryLength` | `number` | `100` | Max messages stored locally |
| `separateSubpageHistory` | `boolean` | `false` | Separate history per URL path |
| `enableMarkdown` | `boolean` | `true` | Render Markdown in bot replies |
| `enableTypewriter` | `boolean` | `true` | Typewriter animation for bot replies |
| `typewriterSpeed` | `object` | `{ min: 30, max: 70 }` | Typewriter speed range in ms per character |
| `typewritewithscroll` | `boolean` | `false` | Auto-scroll while typewriter is animating |
| `enableTypingIndicator` | `boolean` | `true` | Show "Thinking…" while waiting |
| `showTypingText` | `boolean` | `true` | Show text label next to typing dots |
| `typingIndicatorColor` | `string` | `'#666'` | Color of the typing dots |
| `showTimestamp` | `boolean` | `false` | Show time on each message |
| `chips` | `array` | `[]` | Suggestion chip buttons, e.g. `['Help', 'Pricing']` |

### File Upload

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableFileUpload` | `boolean` | `true` | Enable file / image attachments |
| `fileAccept` | `string` | `'image/*,.pdf,.doc,.docx,.txt'` | Accepted MIME types or extensions |
| `maxFiles` | `number` | `null` | Max files per message (`null` = unlimited) |
| `enableEnhancedMobileInput` | `boolean` | `true` | Optimised input handling on mobile |

### Backend History

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableBackendHistory` | `boolean` | `true` | Send conversation history to the API |
| `backendHistoryEndpoint` | `string` | `''` | Separate endpoint to fetch server-side history |
| `deleteEndpoint` | `string` | `{apiEndpoint}/delete-history` | Endpoint called when the user clears chat |
| `feedbackEndpoint` | `string` | `{apiEndpoint}/feedback` | Endpoint for like/dislike feedback |
| `enableServerHistoryDelete` | `boolean` | `false` | Call `deleteEndpoint` when erasing chat |

### UI & Branding

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showBranding` | `boolean` | `true` | "Powered by" footer link |
| `brandingText` | `string` | `'Powered by NeuroBrain'` | Footer brand label |
| `brandingUrl` | `string` | `'https://neurobrains.co/'` | Footer brand URL |
| `showMessageActions` | `boolean` | `true` | Like / dislike / copy / regenerate buttons |
| `enableDeleteButton` | `boolean` | `true` | Show clear-chat button in header |
| `aiAvatar` | `string` | `null` | URL, emoji, or inline SVG for the AI avatar |
| `showAiAvatar` | `boolean` | `true` | Show/hide the AI avatar next to messages |
| `chatBackgroundColor` | `string` | `'#ffffff'` | Chat panel background color |
| `chatBackgroundImage` | `string` | `null` | CSS background-image for the chat panel |
| `sendButtonIconSize` | `number` | `24` | Send button icon size in px |
| `showPrivacyNotice` | `boolean` | `false` | Show a small privacy notice below the input |
| `privacyNoticeText` | `string` | `'Messages may be stored to improve responses.'` | Privacy notice copy |

### Toggle Button

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `toggleButtonIcon` | `string` | default chat icon | URL, emoji, or SVG for the toggle button |
| `toggleButtonSize` | `number` | `60` | Toggle button diameter in px (40–80) |
| `toggleButtonAnimation` | `number` | `4` | Animation style 0–5 (`0` = none) |
| `toggleButtonBottomMargin` | `number` | `50` | Distance from the bottom of the viewport in px |
| `toggleButtonRightMargin` | `number` | `30` | Distance from the right edge of the viewport in px |
| `websiteBottomSpacing` | `number` | `0` | Extra bottom spacing to avoid overlapping site elements |

### Text Box Pop-up

The small speech-bubble pop-up that appears above the toggle button before the chat is opened.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showTextBox` | `boolean` | `true` | Show the pop-up text box |
| `textBoxMessage` | `string` | `'Hi there! If you need any assistance, I am always here.'` | Main message |
| `textBoxSubMessage` | `string` | `'24/7 Live Chat Support'` | Sub-message |
| `showTextBoxCloseButton` | `boolean` | `true` | Allow user to dismiss the pop-up |
| `textBoxTextColor` | `string` | `'primary'` | `'primary'` (uses `primaryColor`), `'default'`, or any hex |
| `textBoxSpacingFromToggle` | `number` | `0` | Gap between the pop-up and toggle button in px |

### Native Lead Form

A fully built-in, no-dependency lead-capture form. Fields, labels, and validation are all customisable. Data is saved to `localStorage` and, optionally, the submitted email is used as the API `user_id` from that point on.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `nativeForm.enabled` | `boolean` | `false` | Enable the native form |
| `nativeForm.trigger` | `string` | `'onOpen'` | When to show — `'onOpen'` (chat opens) or `'onFirstMessage'` (first send attempt) |
| `nativeForm.title` | `string` | `'Before we start'` | Modal heading |
| `nativeForm.subtitle` | `string` | `'Tell us a little about yourself.'` | Modal sub-heading |
| `nativeForm.submitLabel` | `string` | `'Start chatting'` | Submit button label |
| `nativeForm.useEmailAsUserId` | `boolean` | `true` | After submission, set the email field value as the persistent API `user_id` |
| `nativeForm.storageKey` | `string\|null` | `null` | localStorage key prefix. `null` → auto (`cnf_<hostname>`) |
| `nativeForm.fields` | `array` | name + email + phone | Array of field descriptors — see table below |
| `nativeForm.onSubmit` | `async function\|null` | `null` | Optional async callback `(formData) => void\|false`. Return `false` to block submission. |

**Field descriptor shape**

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `name` | `string` | yes | Field key, also used as the `localStorage` data property |
| `label` | `string` | yes | Label shown above the input |
| `type` | `string` | no | HTML input type — `'text'` `'email'` `'tel'` `'number'` etc. Default `'text'` |
| `required` | `boolean` | no | Mark field as required. Default `false` |
| `placeholder` | `string` | no | Input placeholder text |
| `validate` | `function` | no | Custom validator `(value: string) => errorMessage \| ''`. Overrides built-in type checks. |

**localStorage keys written on submit**

| Key | Value |
|-----|-------|
| `cnf_<hostname>_submitted` | `"true"` |
| `cnf_<hostname>_data` | JSON — all field values + `submittedAt` ISO timestamp |

### HubSpot Lead Form

Displays a lead-capture form before or during chat. Requires HubSpot portal credentials.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hubspot.enabled` | `boolean` | `false` | Enable HubSpot form integration |
| `hubspot.portalId` | `string` | `''` | HubSpot portal ID |
| `hubspot.formGuid` | `string` | `''` | HubSpot form GUID |
| `hubspot.triggerKeywords` | `array` | `['pricing','demo','contact','quote','help','support']` | Keywords that trigger the form |
| `showFormOnStart` | `boolean` | `true` | Show form when chat opens for new users |
| `useEmailAsUserId` | `boolean` | `true` | Use submitted email as the persistent user ID (HubSpot form only) |
| `formTitle` | `string` | `'Give Your Details'` | Form modal title |
| `formSubtitle` | `string` | `'Please provide your information to start chatting.'` | Form modal subtitle |

### Supabase Chat History

Persist chat history in Supabase so sessions survive across devices and browsers.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `supabase.enabled` | `boolean` | `false` | Enable Supabase persistence |
| `supabase.url` | `string` | `''` | Supabase project URL |
| `supabase.anonKey` | `string` | `''` | Supabase anon/public API key |
| `supabase.tableName` | `string` | `'chat_history'` | Table to store messages |
| `supabase.historyLimit` | `number` | `50` | Max rows to load on widget open |
| `supabase.pollIntervalMs` | `number` | `5000` | Background refresh interval (ms); Realtime gives instant delivery |

### Parlant Integration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `parlant.enabled` | `boolean` | `false` | Enable Parlant agent integration |
| `parlant.apiBaseUrl` | `string` | `''` | Parlant API base URL |

### Callbacks

| Option | Type | Description |
|--------|------|-------------|
| `onInit` | `function` | Called when the widget is ready |
| `onMessage` | `function` | Called on every message send / receive |
| `onError` | `function` | Called on API errors |

---

## Native Lead Form

Capture user details before or during chat — no HubSpot account needed. All data stays in the user's browser.

### Minimal setup

```js
new Chatnest({
  apiEndpoint: 'https://your-api.com/chat',
  nativeForm: {
    enabled: true
  }
});
```

Shows a name + email + phone form when the chat opens. After submission the email becomes the persistent `user_id` on every API request.

### Custom fields

```js
new Chatnest({
  apiEndpoint: 'https://your-api.com/chat',
  nativeForm: {
    enabled:     true,
    trigger:     'onFirstMessage',   // intercept first send attempt
    title:       'Quick intro',
    subtitle:    'We use this to personalise your experience.',
    submitLabel: 'Let\'s go',
    fields: [
      { name: 'fullname', label: 'Your name',    type: 'text',  required: true  },
      { name: 'email',    label: 'Work email',   type: 'email', required: true  },
      { name: 'company',  label: 'Company',      type: 'text',  required: false,
        validate: (v) => v.length >= 2 ? '' : 'Enter your company name.' }
    ]
  }
});
```

### Custom submit hook

```js
new Chatnest({
  nativeForm: {
    enabled: true,
    onSubmit: async (formData) => {
      // formData = { fullname, email, company, submittedAt }
      const res = await fetch('/api/leads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData)
      });
      if (!res.ok) return false; // returning false shows an error and keeps the form open
    }
  }
});
```

### Reading stored data in your own code

```js
// Check if the user already submitted
const submitted = localStorage.getItem('cnf_yourdomain.com_submitted') === 'true';

// Read field values
const data = JSON.parse(localStorage.getItem('cnf_yourdomain.com_data') || 'null');
// { fullname: 'Jane Doe', email: 'jane@co.com', submittedAt: '2025-04-03T...' }
```

---

## User ID Control

By default ChatNest auto-generates a random `user_id` per browser and persists it in `localStorage`. You can override this at any level of precision:

```js
// 1. Static — same ID for every visitor (useful for authenticated apps)
new Chatnest({ userId: 'user_42' });

// 2. Dynamic — evaluated on every API request
new Chatnest({
  userId: (userManager) => {
    // userManager.currentUser is the auto-generated or email-derived ID
    return window.__myApp?.loggedInUserId || userManager.currentUser;
  }
});

// 3. Email from nativeForm — no extra config needed
//    When nativeForm.useEmailAsUserId is true (the default),
//    the email the user submits automatically becomes userManager.currentUser
//    and is used on all subsequent requests.
new Chatnest({
  nativeForm: { enabled: true, useEmailAsUserId: true }
});
```

**Resolution order on each API call:**
1. `config.userId` (string or function), if set
2. `userManager.currentUser` — which is the submitted email after `nativeForm` or `hubspot` form submission (when `useEmailAsUserId: true`)
3. Auto-generated `user_<domain><timestamp>_<random>` persisted in `localStorage`

---

## Supabase Setup

### 1. Create the table

```sql
CREATE TABLE IF NOT EXISTS chat_history (
  id        BIGSERIAL PRIMARY KEY,
  user_id   TEXT NOT NULL,
  domain    TEXT NOT NULL,
  query     TEXT NOT NULL,
  response  TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_domain ON chat_history (user_id, domain);
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp   ON chat_history (timestamp DESC);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_history_open" ON chat_history FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for instant Messenger-like delivery (optional but recommended)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_history;
```

### 2. Configure

```js
new Chatnest({
  apiEndpoint: 'https://your-api.com/chat',
  supabase: {
    enabled:      true,
    url:          'https://xxxxxxxxxxxx.supabase.co',
    anonKey:      'your-anon-key',
    tableName:    'chat_history',  // optional
    historyLimit: 50               // optional
  }
});
```

> Find `url` and `anonKey` in **Supabase → Project Settings → API**.

**Real-time sync** — The widget polls for new rows every 3 seconds. When a human agent or backend adds a reply to `chat_history`, it appears live, like Messenger. Tune with `supabase.pollIntervalMs`.

**Multi-part responses (`,,,`)** — If your API returns multiple replies concatenated with three commas, ChatNest splits them into separate messages:  
`"Hello!,,,How can I help?"` → two bot messages.

---

## Product Carousel

When your API returns a `products` array, ChatNest renders product cards with image, name, price, highlights, and a CTA button.

```js
new Chatnest({
  apiEndpoint: 'https://your-api.com/chat',
  productInjectionMarker: 'Here are some recommendations:',
  apiResponseFormat: {
    response: 'response',
    products: 'products',
    productItem: {
      name:       'name',
      price:      'price',
      image:      'image_url',
      link:       'buy_link',
      highlights: 'highlights',
      ctaText:    'Buy now'
    }
  }
});
```

Expected API response shape:
```json
{
  "response": "Here are some recommendations:\n\n",
  "products": [
    { "name": "Product A", "price": "$29", "image_url": "...", "buy_link": "...", "highlights": "Lightweight" }
  ]
}
```

---

## File Upload

```js
new Chatnest({
  apiEndpoint:          'https://your-api.com/chat',
  enableFileUpload:     true,
  useMultipartFormData: true,
  apiDataFormat:        'form-data',
  fileAccept:           'image/*',
  maxFiles:             1
});
```

Single file → sent as `image` field. Multiple files → `file_0`, `file_1`, etc.

---

## Troubleshooting

**Widget not loading**  
Wrap init in `DOMContentLoaded`. Load the script before your init code.

**422 error from API**  
Your API expects different field names:
```js
apiRequestFormat: { query: 'message', userId: 'user_id', domain: 'domain' }
```

**Products not showing**  
Ensure your API returns a `products` array and `productInjectionMarker` matches text in the `response` field.

**Supabase history not loading**  
- Confirm `supabase.enabled: true` and credentials are correct  
- Check RLS policies allow reads with the anon key  
- Check browser console for `[Supabase]` error messages

---

## License

MIT © [Sifat Hasan](https://github.com/Pro-Sifat-Hasan)
