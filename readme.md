# ChatNest

![ChatNest](https://i.ibb.co.com/ts1T0q7/chatnest.jpg) _____________________________________________________________________________________

ChatNest is a lightweight, customizable, and easy-to-integrate JavaScript widget for adding chat functionality to your web applications. It comes with a flexible configuration system, allowing you to tailor the chatbot's appearance and behavior to suit your app's needs.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Configuration Options](#configuration-options)
- [Example Initialization with Full Configuration](#example-initialization-with-full-configuration)
- [Dependencies](#dependencies)

## Installation

To include ChatNest in your project, add the following CDN link to your HTML file:

```html
<script src="https://cdn.jsdelivr.net/npm/chatnest@3.0.0"></script>
```

Alternatively, you can install it using npm:

```bash
npm install chatnest
```

## Usage
Once ChatNest is included, you can initialize the chat widget by creating an instance of EasyChatWidget in your JavaScript code. For example:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = new EasyChatWidget({
        botName: 'Support Bot',
        botImage: 'https://example.com/bot-image.png',
        greeting: 'Hi there! How can I assist you today?',
        apiEndpoint: 'https://your-api-endpoint.com/chat',
        primaryColor: '#1a73e8',
        width: '400px',
        height: '600px'
    });
});
```

## Configuration Options

Below are the available configuration options you can set when initializing EasyChatWidget.

| Option               | Type               | Default Value   | Description                                                                                             |
|----------------------|--------------------|-----------------|---------------------------------------------------------------------------------------------------------|
| `botName`            | `string`           | `'Chat Assistant'` | The name of the chatbot, displayed in the widget.                                                        |
| `botImage`           | `string`           | ![default](data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23fff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"%3E%3C/path%3E%3C/svg%3E) | The image of the bot displayed in the chat window. |
| `greeting`           | `string`           | `'Hello! How can I help you today?'` | Initial greeting message displayed to the user.                                                         |
| `placeholder`        | `string`           | `'Type your message here...'` | Placeholder text for the message input field.                                                           |
| `primaryColor`       | `string`           | `'#0084ff'`       | Primary color used for widget styling, such as buttons and highlights.                                  |
| `fontSize`           | `string`           | `'14px'`          | Font size for text in the widget.                                                                      |
| `width`              | `string`           | `'400px'` (restricted between 300px - 600px) | Width of the widget, clamped between 300px and 600px.                                  |
| `height`             | `string`           | `'600px'` (restricted between 400px - 800px) | Height of the widget, clamped between 400px and 800px.                                  |
| `showTimestamp`      | `boolean`          | `false`           | If true, shows timestamps next to messages.                                                            |
| `enableTypingIndicator` | `boolean`     | `true`            | Displays typing indicator when bot is processing messages.                                            |
| `enableMarkdown`     | `boolean`          | `true`            | Enables Markdown formatting in messages. Requires Marked.js as a dependency.                          |
| `enableHistory`      | `boolean`          | `true`            | Saves chat history locally, so it persists when the page is refreshed.                               |
| `maxHistoryLength`   | `number`           | `100`             | Maximum number of messages saved in chat history.                                                      |
| `enableTypewriter`   | `boolean`          | `true`            | Enables typewriter effect for bot responses.                                                           |
| `typewriterSpeed`    | `object`           | `{ min: 30, max: 70 }` | Speed (in milliseconds) of the typewriter effect.                                                      |
| `chips`              | `array`            | `[]`              | Predefined response options shown as clickable chips.                                                  |
| `customStyles`       | `object`           | `{}`              | Custom CSS styles for the widget components.                                                           |
| `onInit`             | `function`         | `null`            | Callback executed when the widget is initialized.                                                      |
| `onMessage`          | `function`         | `null`            | Callback executed when a message is sent or received.                                                  |
| `onError`            | `function`         | `null`            | Callback executed when an error occurs.                                                                |
| `apiEndpoint`        | `string`           | `'http://localhost:7000/chat'` | Endpoint 
for the bot's chat API. Adjusts based on protocol (e.g., https:// if current site is secure). |
| `apiKey`               | `string` | `''`                                                                         | API key used for authentication.                                                                         |
| `apiHeaders`           | `object` | `{ 'Content-Type': 'application/json' }`                                     | HTTP headers sent with each API request.                                                                 |
| `apiRequestFormat`     | `object` | `{ query: 'query', userId: 'userId', domain: 'domain' }`                     | Defines the request format mapping, specifying the fields for query, user ID, and domain.                |
| `apiResponseFormat`    | `object` | `{ response: 'response' }`                                                   | Defines the response format mapping, specifying the field that contains the bot's response.              |
| `apiMethod`            | `string` | `'POST'`                                                                     | HTTP method used for API requests, typically `POST`.                                                     |
| `apiTimeout`           | `number` | `30000` (30 seconds)


## Example Initialization with Full Configuration

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = new EasyChatWidget({
        botName: 'Customer Support Bot',
        botImage: 'https://example.com/bot-avatar.png',
        greeting: 'Welcome! How can we assist you?',
        placeholder: 'Type your message here...',
        primaryColor: '#00796b',
        fontSize: '16px',
        width: '500px',
        height: '700px',
        showTimestamp: true,
        enableTypingIndicator: true,
        enableMarkdown: true,
        enableHistory: true,
        maxHistoryLength: 200,
        enableTypewriter: true,
        typewriterSpeed: { min: 50, max: 100 },
        chips: ['Order Status', 'Product Inquiry', 'Support'],
        customStyles: {
            backgroundColor: '#f0f0f0',
            color: '#333'
        },
        onInit: () => console.log('Chat widget initialized'),
        onMessage: (message) => console.log('Message received:', message),
        onError: (error) => console.error('An error occurred:', error),
        apiEndpoint: 'https://api.example.com/chat'
    });
});
```

## Dependencies

If you enable Markdown rendering (`enableMarkdown: true`), the widget will load [Marked.js](https://cdn.jsdelivr.net/npm/marked@14.1.3/lib/marked.umd.min.js) from a CDN by default.

## Look of the chat widget

![ChatNest](https://i.ibb.co.com/tB5nTsf/image.png)
