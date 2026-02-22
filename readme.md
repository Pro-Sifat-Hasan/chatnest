# ChatNest

<p align="center">
  <img src="https://i.ibb.co.com/ts1T0q7/chatnest.jpg" alt="ChatNest" width="400">
</p>

**ChatNest** is a lightweight, customizable chat widget for modern web applications. Add AI-powered chat to any website in minutes with flexible configuration, file uploads, product carousels, and full API customization.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Product Carousel & API Response](#product-carousel--api-response)
- [File Upload](#file-upload)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Modern UI** — Clean, responsive design with Plus Jakarta Sans typography
- **File & Image Upload** — Attach images and files; preview before sending; images persist in chat history
- **Product Carousel** — Display product recommendations from your API with cards, prev/next navigation, and "Buy product" buttons
- **Customizable API** — Map response fields, product structure, and injection markers to match any API
- **Chat History** — LocalStorage persistence with image support across page reloads
- **Markdown & Typewriter** — Rich text responses with optional typewriter effect
- **Mobile-First** — Touch-optimized, fullscreen on mobile
- **LangChain & RAG Ready** — Works with LangChain, RAG, or any REST API

---

## Quick Start

```html
<script src="https://cdn.jsdelivr.net/npm/chatnest@3.4.0/dist/chatnest.min.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    new Chatnest({
      botName: 'Support Bot',
      greeting: 'Hi! How can I help you today?',
      apiEndpoint: 'https://your-api.com/chat',
      primaryColor: '#1a73e8'
    });
  });
</script>
```

---

## Installation

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/chatnest@3.4.0/dist/chatnest.min.js"></script>
```

Or unpkg:

```html
<script src="https://unpkg.com/chatnest@3.4.0/dist/chatnest.min.js"></script>
```

### npm

```bash
npm install chatnest
```

```javascript
import Chatnest from 'chatnest';
// or
const Chatnest = require('chatnest');
```

---

## Configuration

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `botName` | `string` | `'Chat Assistant'` | Bot name in header |
| `botImage` | `string` | default avatar | Bot avatar URL |
| `greeting` | `string` | `'Hello! How can I help you today?'` | Initial greeting |
| `placeholder` | `string` | `'Type your message here...'` | Input placeholder |
| `primaryColor` | `string` | `'#0084ff'` | Primary color (hex or gradient) |
| `width` | `string` | `'400px'` | Chat width (300–600px) |
| `height` | `string` | `'600px'` | Chat height (400–800px) |
| `apiEndpoint` | `string` | `'http://localhost:7000/chat'` | Chat API URL |
| `position` | `string` | `'bottom-right'` | Widget position: `bottom-right`, `bottom-left`, `bottom-center`, `top`, `left`, `right`, `top-right`, `top-left` |

### API & Request Format

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `''` | Bearer token for API auth |
| `apiHeaders` | `object` | `{ 'Content-Type': 'application/json' }` | Request headers |
| `apiMethod` | `string` | `'POST'` | HTTP method |
| `apiTimeout` | `number` | `30000` | Request timeout (ms) |
| `apiRequestFormat` | `object` | `{ query: 'query', userId: 'userId', domain: 'domain' }` | Request field mapping |
| `apiResponseFormat` | `object` | See below | Response & product mapping |
| `useMultipartFormData` | `boolean` | `true` | Use multipart for file uploads |
| `apiDataFormat` | `string` | `'json'` | `'json'` or `'form-data'` |
| `transformRequest` | `function` | `null` | Transform request before send |
| `transformResponse` | `function` | `null` | Transform response before display |

### File Upload

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableFileUpload` | `boolean` | `true` | Enable file attachment |
| `fileAccept` | `string` | `'image/*,.pdf,.doc,.docx,.txt'` | Accepted file types |
| `maxFiles` | `number` | `null` | Max files (e.g. `1` for single image) |

### Chat Behavior

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableHistory` | `boolean` | `true` | Persist chat in localStorage |
| `maxHistoryLength` | `number` | `100` | Max stored messages |
| `enableMarkdown` | `boolean` | `true` | Render Markdown (requires Marked.js) |
| `enableTypewriter` | `boolean` | `true` | Typewriter effect for bot replies |
| `enableTypingIndicator` | `boolean` | `true` | Show "Thinking..." |
| `chips` | `array` | `[]` | Suggestion chips (e.g. `['Help', 'Pricing']`) |

### UI & Branding

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showBranding` | `boolean` | `true` | Show "Powered by" footer |
| `brandingText` | `string` | `'Powered by NeuroBrain'` | Brand name |
| `brandingUrl` | `string` | `'https://neurobrains.co/'` | Brand link |
| `showMessageActions` | `boolean` | `true` | Like, dislike, copy, regenerate |
| `showDeleteButton` | `boolean` | `true` | Clear chat button |
| `theme` | `string` | `'light'` | `'light'` or `'dark'` |

### Callbacks

| Option | Type | Description |
|--------|------|-------------|
| `onInit` | `function` | Called when widget is ready |
| `onMessage` | `function` | Called on send/receive |
| `onError` | `function` | Called on errors |

---

## Product Carousel & API Response

When your API returns a `products` array, ChatNest renders a carousel with product cards (image, name, highlights, price, Buy button).

### API Response Format

```javascript
apiResponseFormat: {
  response: 'response',   // Key for main text
  products: 'products',   // Key for products array
  productItem: {
    name: 'name',
    price: 'price',
    image: 'image_url',
    link: 'buy_link',
    highlights: 'highlights',
    ctaText: 'Buy product'
  }
}
```

### Product Injection Marker

Products are inserted after a configurable text marker:

```javascript
productInjectionMarker: 'Here are some product recommendations that might be beneficial for your skin condition:'
// or array of possible markers:
productInjectionMarker: ['Marker 1...', 'Marker 2...']
```

### Example API Response (Klyra-style)

```json
{
  "response": "Here are some tips...\n\nHere are some product recommendations that might be beneficial for your skin condition:\n\n\n\n",
  "products": [
    {
      "id": "1",
      "name": "Product Name",
      "highlights": "Lightweight, Hydrating",
      "price": "995TK",
      "image_url": "https://...",
      "buy_link": "https://..."
    }
  ]
}
```

### Custom API Shape

For different field names:

```javascript
apiResponseFormat: {
  response: 'message',
  products: 'recommendations',
  productItem: {
    name: 'title',
    price: 'cost',
    image: 'thumbnail',
    link: 'url',
    highlights: 'tags',
    ctaText: 'Add to cart'
  }
}
```

---

## File Upload

### Single Image (e.g. skincare analysis)

```javascript
new Chatnest({
  apiEndpoint: 'https://your-api.com/chat',
  useMultipartFormData: true,
  apiDataFormat: 'form-data',
  fileAccept: 'image/*',
  maxFiles: 1
});
```

### Multiple Files

```javascript
new Chatnest({
  enableFileUpload: true,
  fileAccept: 'image/*,.pdf,.doc,.docx,.txt'
  // maxFiles: null (default) = multiple
});
```

- **Image preview** before sending
- **Image persistence** in chat history (base64 in localStorage)
- **Multipart form** sends files as `image` (single) or `file_0`, `file_1` (multiple)

---

## Examples

### E-commerce with Products

```javascript
new Chatnest({
  botName: 'Product Assistant',
  apiEndpoint: 'https://your-api.com/chat',
  productInjectionMarker: 'Here are some products that might help:',
  apiResponseFormat: {
    response: 'response',
    products: 'products',
    productItem: {
      name: 'name',
      price: 'price',
      image: 'image_url',
      link: 'buy_link',
      highlights: 'highlights',
      ctaText: 'Buy product'
    }
  }
});
```

### Image Upload + Products

```javascript
new Chatnest({
  botName: 'Support Bot',
  apiEndpoint: 'https://klyra-api.example.com/chat',
  useMultipartFormData: true,
  apiDataFormat: 'form-data',
  fileAccept: 'image/*',
  maxFiles: 1,
  productInjectionMarker: 'Here are some product recommendations that might be beneficial for your skin condition:',
  apiResponseFormat: {
    response: 'response',
    products: 'products',
    productItem: { name: 'name', price: 'price', image: 'image_url', link: 'buy_link', highlights: 'highlights' }
  }
});
```

### Minimal Setup

```javascript
new Chatnest({
  botName: 'Help Bot',
  greeting: 'Ask me anything!',
  apiEndpoint: 'https://your-api.com/chat'
});
```

---

## Troubleshooting

### CDN Not Loading

- Use full path: `https://cdn.jsdelivr.net/npm/chatnest@3.4.0/dist/chatnest.min.js`
- Load script before your init code
- Wrap init in `DOMContentLoaded`

### 422 Error

API expects different format. Try:

```javascript
{
  useMultipartFormData: true,
  apiDataFormat: 'form-data',
  apiRequestFormat: { query: 'message', userId: 'user_id', domain: 'domain' }
}
```

### File Upload Not Working

1. `enableFileUpload: true`
2. `useMultipartFormData: true`
3. `apiDataFormat: 'form-data'` for multipart
4. Check server file size limits

### Products Not Showing

1. Ensure API returns `products` array (or your custom key via `apiResponseFormat.products`)
2. Set `productInjectionMarker` to match text in your `response`
3. Check `productItem` mapping matches your API fields

---

## Dependencies

- **Marked.js** — Loaded from CDN when `enableMarkdown: true` (default)

---

## License

MIT © [Sifat Hasan](https://github.com/Pro-Sifat-Hasan)
