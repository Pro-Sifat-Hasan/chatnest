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
<script src="https://cdn.jsdelivr.net/npm/chatnest@2.5.6"></script>
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
| `primaryColor`           | `string`           | `'#0084ff'`                                  | Primary color used for styling widget buttons, highlights, and other accents. Supports hex colors and CSS gradients (e.g., `'linear-gradient(to right, #2563eb, #9333ea)'`). |
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
| `typewritewithscroll`    | `boolean`          | `false`                                      | When `true`: AI response uses typewriter effect WITH scrolling. When `false`: typewriter WITHOUT scrolling. |
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
| `enableFileUpload`      | `boolean`          | `true`                                                                                               | Show/hide file upload button. Set to `false` to disable file upload functionality.                    |
| `enableDeleteButton`    | `boolean`          | `true`                                                                                               | Show/hide delete chat history button. Set to `false` to hide the delete button.                      |
| `useMultipartFormData`  | `boolean`          | `true`                                                                                               | Use multipart form data for API calls. Required for file uploads and some API endpoints.             |
| `apiDataFormat`         | `string`           | `'json'`                                                                                             | API data format: `'json'` or `'form-data'`. Use `'form-data'` for multipart requests.               |
| `typingIndicatorColor`  | `string`           | `'#666'`                                                                                             | Color for the typing indicator dots. Use a single color for all 3 dots.                            |
| `showTypingText`        | `boolean`          | `true`                                                                                               | Show/hide the "AI is thinking..." text below the typing indicator dots.                            |
| `toggleButtonIcon`      | `string`           | `null`                                                                                               | Custom icon for the toggle button when closed. When open, shows a down arrow. Supports emoji, image URL, or SVG.                              |
| `chatBackgroundImage`   | `string`           | `null`                                                                                               | Custom background image for the chat messages section. Supports image URLs.                                                              |
| `chatBackgroundColor`   | `string`           | `'#ffffff'`                                                                                          | Custom background color for the chat messages section. Used when no image is set. Default: white.                                        |
| `sendButtonIconSize`    | `number`           | `24`                                                                                                 | Size of the send button icon in pixels. Default: 24px.                                                                                  |
| `enableEnhancedMobileInput` | `boolean`      | `true`                                                                                               | Enhanced mobile input handling for better touch interaction and focus management. Default: true.                                        |
| `aiAvatar`                  | `string`       | `null`                                                                                               | AI avatar for bot messages. Supports emoji, image URL, or SVG. Default: robot emoji (🤖).                                              |
| `showAiAvatar`              | `boolean`      | `true`                                                                                               | Show AI avatar in bot messages. Default: true.                                                                                        |
| `botSubname`                | `string`       | `null`                                                                                               | Subname or descriptive text for the bot (displayed in chat header under bot name). Default: null.                                    |
| `showBotSubname`            | `boolean`      | `true`                                                                                               | Show bot subname in chat header. Default: true.                                                                                        |
| `showFormOnStart`           | `boolean`      | `true`                                                                                               | Show HubSpot form when chat opens (instead of trigger words). Default: true.                                                          |
| `useEmailAsUserId`          | `boolean`      | `true`                                                                                               | Use email from form as user ID. Default: true.                                                                                         |
| `showBranding`              | `boolean`      | `true`                                                                                               | Show/hide the branding section below the chat input. Default: true.                                                                   |
| `brandingText`              | `string`       | `'Powered by NeuroBrain'`                                                                            | Company name for branding. The widget will show "Powered by [Company]" where [Company] is extracted from this text (removing "Powered by" prefix if present). Company name will be bold and linked. |
| `brandingUrl`               | `string`       | `'https://neurobrains.co/'`                                                                         | URL that the branding text links to. Default: 'https://neurobrains.co/'.                                                             |
| `showMessageActions`        | `boolean`      | `true`                                                                                               | Show/hide message action buttons (copy, like, dislike, regenerate) on AI responses. Default: true.                                   |
| `showTextBox`               | `boolean`      | `true`                                                                                               | Show/hide the floating text box above the toggle button. Default: true.                                                               |
| `textBoxMessage`            | `string`       | `'Hi there! If you need any assistance, I am always here.'`                                        | Main text message displayed in the floating text box above the toggle button.                                                        |
| `textBoxSubMessage`         | `string`       | `'💬 24/7 Live Chat Support'`                                                                        | Sub message displayed in the text box after the separator line.                                                                       |
| `showTextBoxCloseButton`    | `boolean`      | `true`                                                                                               | Show/hide the close button on the text box. Default: true.                                                                           |
| `toggleButtonAnimation`     | `number`       | `4`                                                                                                  | Toggle button animation type: 0=none, 1=pulse, 2=bounce, 3=shake, 4=infinity(grow-shrink), 5=rotate. Default: 4 (infinity effect). |
| `toggleButtonSize`          | `number`       | `60`                                                                                                 | Toggle button size in pixels. Range: 40-80px. Default: 60px.                                                                        |
| `toggleButtonBottomMargin`  | `number`       | `50`                                                                                                 | Bottom margin of toggle button in pixels. Range: 10-50px. Default: 50px.                                                           |
| `toggleButtonRightMargin`   | `number`       | `30`                                                                                                 | Right margin of toggle button in pixels. Range: 10-100px. Default: 30px.                                                          |
| `websiteBottomSpacing`      | `number`       | `0`                                                                                                  | Additional bottom spacing for website integration in pixels. Range: 0-100px. Default: 0px.                                         |
| `textBoxSpacingFromToggle`  | `number`       | `0`                                                                                                  | Spacing between text box and toggle button in pixels. Range: 0-30px. Default: 0px (touching).                                    |
| `textBoxTextColor`          | `string`       | `'primary'`                                                                                          | Text color for text box content. Use 'primary' for primary color, 'default' for standard colors, or any CSS color value.         |



### Key Features:
- **Responsive Design**: Automatically adapts to different screen sizes and devices
- **Smart Positioning**: Prevents text box cutoff with dynamic max-width calculations
- **Z-Index Management**: Optimal layering for clean interface without overlapping elements
- **Gradient Support**: Text box content supports CSS gradients when using gradient primary colors
- **Click Outside to Close**: Chat window closes when clicking outside the widget
- **Touch Positioning**: Text box can touch toggle button for seamless integration

## New Features (v2.5.0+)

### File Upload Support
ChatNest now supports file uploads with the following capabilities:
- **Supported Formats**: Images (JPG, PNG, GIF), PDFs, Word documents (DOC, DOCX), and text files (TXT)
- **Multiple Files**: Select and upload multiple files simultaneously
- **File Preview**: See selected files with size information before sending
- **File Management**: Remove individual files from selection
- **Configurable**: Enable/disable file upload functionality with `enableFileUpload` option

### Enhanced API Integration
- **Multipart Form Data**: Full support for multipart/form-data format for file uploads
- **422 Error Resolution**: Proper handling of API data format requirements to prevent 422 errors
- **Flexible Data Format**: Choose between JSON and multipart form data with `apiDataFormat` option
- **Request/Response Mapping**: Customize field names to match your API's expected format

### UI Improvements
- **Black Action Icons**: Professional black 3-dot menu icons for better visibility
- **Configurable Buttons**: Show/hide file upload and delete buttons as needed
- **Better Error Handling**: Enhanced error messages and user feedback
- **Fixed Typing Indicator**: Typing indicator now only shows when AI is actively processing, not on widget initialization
- **Custom Toggle Button Icon**: Customize the opening chat window circle logo with emoji, image, or SVG
- **Custom Chat Background**: Add custom background images or colors to the chat messages section for better branding and visual appeal
- **AI Avatar System**: Customizable AI avatar with bot name display inside each bot message bubble, and optional subname in the header
- **Customizable Send Button**: Adjust the size of the send button icon for better visibility and user experience
- **Enhanced Mobile Input**: Improved mobile input handling with auto-focus, focus restoration, and better touch interaction
- **HubSpot Form Integration**: Show form on chat open with Name, Email, Phone fields, save to HubSpot, and use email as user ID
- **Typewriter Scroll Control**: Configure whether typewriter effect scrolls with text or remains static with `typewritewithscroll` option
- **Auto Scroll to Bottom**: Chat window automatically scrolls to bottom when opened for better user experience

### Configuration Examples

#### Basic Configuration Examples
```javascript
// File upload with gradient text
const chatWidget = new EasyChatWidget({
    enableFileUpload: true,
    showTextBox: true,
    textBoxTextColor: 'primary',
    primaryColor: 'linear-gradient(45deg, #2563eb, #9333ea)',
    apiEndpoint: 'https://your-api.com/chat'
});

// Custom branding with gradient
const chatWidget = new EasyChatWidget({
    showBranding: true,
    brandingText: 'Your Company',
    brandingUrl: 'https://yourcompany.com',
    primaryColor: 'linear-gradient(to right, #2563eb, #9333ea)',
    apiEndpoint: 'https://your-api.com/chat'
});

// Text box with perfect positioning
const chatWidget = new EasyChatWidget({
    showTextBox: true,
    textBoxMessage: 'Need help? We\'re here!',
    textBoxSubMessage: '💬 24/7 Support',
    toggleButtonBottomMargin: 50,
    textBoxSpacingFromToggle: 0, // Touching
    apiEndpoint: 'https://your-api.com/chat'
});
```

## Complete Example

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = new EasyChatWidget({
        // Basic configuration
        botName: 'Customer Support Bot',
        greeting: 'Welcome! How can we assist you?',
        primaryColor: 'linear-gradient(45deg, #2563eb, #9333ea)',
        
        // Text box with gradient support
        showTextBox: true,
        textBoxMessage: 'Need help? We\'re here!',
        textBoxSubMessage: '💬 24/7 Support',
        textBoxTextColor: 'primary',
        
        // Perfect positioning
        toggleButtonBottomMargin: 50,
        textBoxSpacingFromToggle: 0,
        
        // API configuration
        apiEndpoint: 'https://your-api.com/chat',
        enableFileUpload: true,
        
        // Callbacks
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

## Troubleshooting

### 422 Error (Unprocessable Entity)
This usually occurs when the API expects different data format. Try:

1. Set `useMultipartFormData: true` for file uploads
2. Set `apiDataFormat: 'form-data'` for multipart requests
3. Check your `apiRequestFormat` mapping matches your API expectations

### File Upload Issues
1. Ensure `enableFileUpload: true`
2. Set `useMultipartFormData: true`
3. Set `apiDataFormat: 'form-data'`
4. Check file size limits on your server

### API Connection Issues
1. Verify `apiEndpoint` URL is correct
2. Check CORS settings on your server
3. Ensure `apiKey` is valid (if required)
4. Check network connectivity

### Common Configuration Fixes

#### For APIs expecting multipart form data:
```javascript
{
    useMultipartFormData: true,
    apiDataFormat: 'form-data',
    apiRequestFormat: {
        query: 'message',  // Match your API's field name
        userId: 'user_id',
        domain: 'domain'
    }
}
```

#### For APIs expecting JSON:
```javascript
{
    useMultipartFormData: false,
    apiDataFormat: 'json',
    apiRequestFormat: {
        query: 'message',
        userId: 'user_id',
        domain: 'domain'
    }
}
```
