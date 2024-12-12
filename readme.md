# ChatNest

![ChatNest](https://i.ibb.co.com/ts1T0q7/chatnest.jpg) _____________________________________________________________________________________

ChatNest is a lightweight, customizable, and easy-to-integrate JavaScript widget for adding chat functionality to your web applications. It comes with a flexible configuration system, allowing you to tailor the chatbot's appearance and behavior to suit your app's needs.

## Table of Contents
- [Key Features](#key-features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration Options](#configuration-options)
- [Example Initialization with Full Configuration](#example-initialization-with-full-configuration)
- [Dependencies](#dependencies)

## Key Features

1. **Seamless Integration with LLMs using LangChain or RAG (Retrieval-Augmented Generation)**
   - **LangChain Integration**: ChatNest is fully compatible with LangChain, allowing developers to harness the power of large language models (LLMs) directly within their chat interface. This enables dynamic and context-aware responses by structuring conversation history, improving response generation, and enabling multi-turn conversations.
   - **RAG-Based Conversational AI**: With RAG, ChatNest offers access to real-time knowledge bases, document databases, and custom data sources, allowing users to retrieve and interact with up-to-date and accurate information. This setup is ideal for applications that require responses grounded in specific knowledge domains, like customer support, product information, or knowledge retrieval.

2. **Flexible Configuration System**
   - Developers can control chatbot settings, such as default endpoints (e.g., `deleteEndpoint` for clearing history or `apiEndpoint` for main interactions), response types, themes, and interaction prompts.
   - ChatNest supports custom API routes, allowing developers to set up and route requests to specific RAG or LangChain endpoints for highly optimized and tailored performance.

3. **Customizable UI**
   - ChatNest is designed to blend seamlessly with your app’s visual style. You can adjust colors, fonts, and layout, enabling a fully branded chatbot experience.
   - The widget is also mobile-responsive, ensuring optimal user experience across all devices.

## Use Cases

- **Customer Support**: ChatNest, combined with LangChain or RAG, can serve as a smart assistant capable of answering questions based on real-time data from your knowledge base.
- **Product Recommendations**: For e-commerce, ChatNest can pull from product databases, providing users with personalized recommendations and detailed product descriptions.
- **Knowledge Retrieval**: ChatNest can act as a virtual assistant in educational platforms, retrieving information from research papers, textbooks, or articles, enhancing learning experiences.
- **Internal Tools**: Enhance productivity by allowing team members to interact with internal databases or corporate knowledge resources through the chat interface.


## Installation

To include ChatNest in your project, add the following CDN link to your HTML file:

```html
<script src="https://cdn.jsdelivr.net/npm/chatnest@5.0.2"></script>
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


| **Option**               | **Type**            | **Default Value**                            | **Description**                                                                                       |
|--------------------------|---------------------|----------------------------------------------|-------------------------------------------------------------------------------------------------------|
| `botName`                | `string`           | `'Chat Assistant'`                           | The name of the chatbot displayed in the widget header.                                               |
| `botImage`               | `string`           | ![default](data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23fff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"%3E%3C/path%3E%3C/svg%3E) | The image displayed for the bot in the chat.                                                           |
| `greeting`               | `string`           | `'Hello! How can I help you today?'`         | The initial greeting message displayed to users when they open the chat widget.                      |
| `placeholder`            | `string`           | `'Type your message here...'`               | Placeholder text shown in the message input field.                                                   |
| `primaryColor`           | `string`           | `'#0084ff'`                                  | Primary color used for styling widget buttons, highlights, and other accents.                        |
| `fontSize`               | `string`           | `clampFontSize(config.fontSize || 14)`       | Font size for text in the widget, automatically clamped to prevent extremes.                         |
| `width`                  | `string`           | `'400px'` (300px - 600px)                   | Width of the chat widget, restricted between 300px and 600px for responsive layouts.                  |
| `height`                 | `string`           | `'600px'` (400px - 800px)                   | Height of the chat widget, restricted between 400px and 800px for optimal usability.                  |
| `showTimestamp`          | `boolean`          | `false`                                      | If `true`, timestamps are displayed next to each message.                                             |
| `enableTypingIndicator`  | `boolean`          | `true`                                       | Displays a typing indicator when the bot is processing messages.                                      |
| `enableMarkdown`         | `boolean`          | `true`                                       | Enables Markdown formatting in bot responses. Requires `Marked.js` as a dependency.                  |
| `enableHistory`          | `boolean`          | `true`                                       | Saves chat history locally, persisting it when the page is refreshed.                                 |
| `maxHistoryLength`       | `number`           | `100`                                        | Maximum number of messages to store in chat history.                                                  |
| `separateSubpageHistory` | `boolean`          | `false`                                      | If `true`, chat history is stored separately for each subpage of the application.                     |
| `enableTypewriter`       | `boolean`          | `true`                                       | Enables a typewriter effect for bot responses.                                                        |
| `typewriterSpeed`        | `object`           | `{ min: 30, max: 70 }`                       | Speed range (in milliseconds) for the typewriter effect.                                              |
| `chips`                  | `array`            | `[]`                                         | Array of predefined response options displayed as clickable chips.                                    |
| `customStyles`           | `object`           | `{}`                                         | Custom CSS styles for widget components.                                                             |
| `onInit`                 | `function`         | `null`                                       | Callback function executed when the widget is initialized.                                            |
| `onMessage`              | `function`         | `null`                                       | Callback function executed when a message is sent or received.                                        |
| `onError`                | `function`         | `null`                                       | Callback function executed when an error occurs.                                                      |
| `apiEndpoint`            | `string`           | `'http://localhost:7000/chat'`              | The API endpoint for the bot's chat backend. Adjusts based on the site's protocol (e.g., `https://`). |
| `apiKey`                 | `string`           | `''`                                         | API key used for authentication with the backend.                                                     |
| `apiHeaders`             | `object`           | `{ 'Content-Type': 'application/json' }`    | HTTP headers sent with each API request.                                                              |
| `apiRequestFormat`       | `object`           | `{ query: 'query', userId: 'userId', domain: 'domain' }` | Defines the format of API requests, specifying the query, user ID, and domain fields.                |
| `apiResponseFormat`      | `object`           | `{ response: 'response' }`                  | Defines the format of API responses, specifying the field containing the bot's response.              |
| `apiMethod`              | `string`           | `'POST'`                                    | HTTP method used for API requests (e.g., `POST` or `GET`).                                            |
| `apiTimeout`             | `number`           | `30000` (30 seconds)                        | Timeout duration for API requests, in milliseconds.                                                   |
| `deleteEndpoint`         | `string`           | `formatApiEndpoint(config.deleteEndpoint) or ${formatApiEndpoint(config.apiEndpoint).replace(/\/chat$/, '')}/delete-history` | Endpoint for deleting chat history, defaulting to a modified `apiEndpoint` if not explicitly set. |
| `feedbackEndpoint`   | `string`   | `${config.apiEndpoint}/feedback`      | Endpoint used for sending feedback data. If not provided, it defaults to `${config.apiEndpoint}/feedback`. |
| `hubspot.enabled`       | `boolean`          | `false`                                                                                               | Specifies whether the HubSpot integration is enabled.                                                |
| `hubspot.portalId`      | `string`           | `''`                                                                                                 | The HubSpot portal ID for the integration.                                                           |
| `hubspot.formGuid`      | `string`           | `''`                                                                                                 | The GUID of the HubSpot form to be used.                                                             |
| `hubspot.triggerKeywords` | `Array<string>`  | `['pricing', 'demo', 'contact', 'quote', 'help', 'support']`                                         | Keywords that trigger the HubSpot form display.                                                      |
| `hubspot.formShownToUsers` | `Set`           | `new Set()`                                                                                          | Tracks users who have been shown the HubSpot form.                                                   |
| `hubspot.formSubmittedUsers` | `Set`        | `new Set()`                                                                                          | Tracks users who have submitted the HubSpot form.                                                    |
| `position`              | `string`           | `'bottom-right'`                                                                                     | Specifies the position of the HubSpot form on the screen.                                            |



### Notes:
- **Font Size Clamping**: The `fontSize` option is dynamically clamped to avoid excessively large or small font sizes, ensuring a consistent user experience.
- **Separate Subpage History**: The `separateSubpageHistory` option lets you isolate chat histories for different pages or contexts within your app.
- **Default API Endpoints**: The `deleteEndpoint` dynamically derives its value from the `apiEndpoint` if no custom endpoint is provided, ensuring flexibility and ease of configuration.


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
        position: 'bottom-right' // Position the form at the bottom-right of the screen (eg: bottom-left, bottom-center)
        customStyles: {
            backgroundColor: '#f0f0f0',
            color: '#333',
        },
        showTimestamp: true,
        enableTypingIndicator: true,
        enableMarkdown: true,
        enableHistory: true,
        maxHistoryLength: 200,
        separateSubpageHistory: false,
        enableTypewriter: true,
        typewriterSpeed: { 
            min: 50, 
            max: 100 
        },
        chips: ['Order Status', 'Product Inquiry', 'Support'],
        apiEndpoint: 'https://api.example.com/chat',
        apiKey: 'your-api-key-here',
        apiHeaders: { 
            'Content-Type': 'application/json' 
        },
        apiRequestFormat: { 
            query: 'query', 
            userId: 'userId', 
            domain: 'domain' 
        },
        apiResponseFormat: { 
            response: 'response' 
        },
        apiMethod: 'POST',
        apiTimeout: 30000,
        deleteEndpoint: 'https://api.example.com/delete-history',
        feedbackEndpoint: 'https://api.example.com/feedback',
        hubspot: {
            enabled: true, // Enable HubSpot integration
            portalId: '123456', // Replace with your HubSpot portal ID
            formGuid: 'abcdef12-3456-7890-ghij-klmnopqrstuv', // Replace with your form GUID
            triggerKeywords: ['demo', 'pricing'], // Custom trigger keywords
            formShownToUsers: new Set(), 
            formSubmittedUsers: new Set()
        },
        onInit: () => console.log('Chat widget initialized'),
        onMessage: (message) => console.log('Message received:', message),
        onError: (error) => console.error('An error occurred:', error),
    });
});
```

## Dependencies

If you enable Markdown rendering (`enableMarkdown: true`), the widget will load [Marked.js](https://cdn.jsdelivr.net/npm/marked@14.1.3/lib/marked.umd.min.js) from a CDN by default.

## Look of the chat widget

![ChatNest](https://i.ibb.co.com/HPJ7WVL/Screenshot-2024-11-06-090205.png)
