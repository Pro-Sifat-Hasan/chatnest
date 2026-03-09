# ChatNest

<p align="center">
  <img src="https://i.ibb.co.com/ts1T0q7/chatnest.jpg" alt="ChatNest" width="400">
</p>

A lightweight, customizable AI chat widget. Drop it into any website in minutes.

---

## Installation

**CDN**
```html
<script src="https://cdn.jsdelivr.net/npm/chatnest@3.4.0/dist/chatnest.min.js"></script>
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
<script src="https://cdn.jsdelivr.net/npm/chatnest@3.4.0/dist/chatnest.min.js"></script>
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
| `botName` | `string` | `'Chat Assistant'` | Name shown in header |
| `botImage` | `string` | default avatar | Bot avatar URL |
| `greeting` | `string` | `'Hello! How can I help you today?'` | Opening message |
| `placeholder` | `string` | `'Type your message here...'` | Input placeholder |
| `primaryColor` | `string` | `'#0084ff'` | Accent color (hex or CSS gradient) |
| `width` | `string` | `'400px'` | Widget width (300–600px) |
| `height` | `string` | `'600px'` | Widget height (400–800px) |
| `position` | `string` | `'bottom-right'` | `bottom-right` `bottom-left` `bottom-center` `top-right` `top-left` |
| `theme` | `string` | `'light'` | `'light'` `'dark'` `'system'` |

### API

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiEndpoint` | `string` | `'http://localhost:7000/chat'` | Chat endpoint |
| `apiKey` | `string` | `''` | Bearer token |
| `apiHeaders` | `object` | `{ 'Content-Type': 'application/json' }` | Custom headers |
| `apiMethod` | `string` | `'POST'` | HTTP method |
| `apiTimeout` | `number` | `30000` | Timeout in ms |
| `apiRequestFormat` | `object` | `{ query, userId, domain }` | Request field names |
| `apiResponseFormat` | `object` | `{ response, products }` | Response field names |
| `transformResponse` | `function` | `null` | Transform response before display |

### Chat Behavior

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableHistory` | `boolean` | `true` | Persist chat in localStorage |
| `maxHistoryLength` | `number` | `100` | Max stored messages |
| `enableMarkdown` | `boolean` | `true` | Render Markdown |
| `enableTypewriter` | `boolean` | `true` | Typewriter effect |
| `enableTypingIndicator` | `boolean` | `true` | Show "Thinking…" |
| `chips` | `array` | `[]` | Suggestion chips |
| `enableFileUpload` | `boolean` | `true` | File/image attachments |
| `fileAccept` | `string` | `'image/*,.pdf,.doc,.docx,.txt'` | Accepted file types |
| `maxFiles` | `number` | `null` | Max files per message |

### UI & Branding

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showBranding` | `boolean` | `true` | "Powered by" footer |
| `brandingText` | `string` | `'Powered by NeuroBrain'` | Brand label |
| `brandingUrl` | `string` | `'https://neurobrains.co/'` | Brand link |
| `showMessageActions` | `boolean` | `true` | Like / dislike / copy / regenerate |
| `enableDeleteButton` | `boolean` | `true` | Clear chat button |

### Callbacks

| Option | Description |
|--------|-------------|
| `onInit` | Called when widget is ready |
| `onMessage` | Called on every send / receive |
| `onError` | Called on API errors |

---

## Supabase Chat History

ChatNest can persist chat history to Supabase, enabling cross-device, cross-session history — even if the user is offline for months.

### 1. Create the table

Run this in your Supabase SQL editor:

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
```

### 2. Add Supabase config

```js
new Chatnest({
  botName: 'Support Bot',
  apiEndpoint: 'https://your-api.com/chat',

  supabase: {
    enabled:      true,
    url:          'https://xxxxxxxxxxxx.supabase.co',
    anonKey:      'your-anon-key',
    tableName:    'chat_history',   // optional, this is the default
    historyLimit: 50                // optional, messages to load on open
  }
});
```

> Find your `url` and `anonKey` in **Supabase → Project Settings → API**.

### How it works

- Every user message + bot reply is saved as one row (`query` + `response`)
- When the widget opens, history is fetched from Supabase and rendered in order
- Falls back to localStorage if Supabase is not configured or unreachable
- Works across devices — the server is the source of truth, not the browser

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

Your API should return:
```json
{
  "response": "Here are some recommendations:\n\n",
  "products": [
    {
      "name": "Product A",
      "price": "$29",
      "image_url": "https://...",
      "buy_link": "https://...",
      "highlights": "Lightweight, Fast"
    }
  ]
}
```

---

## File Upload

```js
new Chatnest({
  apiEndpoint:        'https://your-api.com/chat',
  enableFileUpload:   true,
  useMultipartFormData: true,
  apiDataFormat:      'form-data',
  fileAccept:         'image/*',
  maxFiles:           1
});
```

Files are sent as multipart form data. Single file → `image` field. Multiple files → `file_0`, `file_1`, etc.

---

## Troubleshooting

**Widget not loading**  
Wrap init in `DOMContentLoaded`. Load the script before your init code.

**422 error from API**  
Your API expects different field names. Set `apiRequestFormat` to match:
```js
apiRequestFormat: { query: 'message', userId: 'user_id', domain: 'domain' }
```

**Products not showing**  
Ensure your API returns a `products` array and `productInjectionMarker` matches text in the `response` field.

**Supabase history not loading**  
- Confirm `enabled: true` and credentials are correct
- Check RLS policies allow reads with the anon key
- Open browser console for `[Supabase]` error messages

---

## License

MIT © [Sifat Hasan](https://github.com/Pro-Sifat-Hasan)
