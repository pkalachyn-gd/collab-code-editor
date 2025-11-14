# Real-time Collaborative Code Editor (Angular + Yjs + Gemini)

This is a mock project submission for a real-time collaborative code editor built with Angular, CodeMirror 6, and Yjs. It features a live collaboration server (Node.js) and a framework for AI code completion (currently mocked) designed to be powered by the Gemini API.

# Architecture Overview

The system is designed as a decoupled frontend and backend, with collaboration and AI logic handled by two separate communication channels.

    Frontend (Angular): A standalone Angular application (/frontend) that hosts a CodeMirror 6 editor.

        CollaborationService: Manages the Yjs document (Y.Doc), UndoManager, and the WebSocket connection to the collaboration server.

        AiCompletionService: Manages requests for AI code completion (currently mocked, returns static data).

        EditorComponent: Orchestrates the services, binds them to the CodeMirror EditorView, and handles UI logic like the completion hotkey and throttling.

    Backend (Two Components):

        1. Collaboration Server (Node.js + y-websocket):

            Located in /backend.

            A minimal Node.js server running on ws://localhost:1234.

            Uses WebSockets to synchronize the Yjs document (CRDT data) between all clients connected to the same "room".

            Manages and broadcasts user "awareness" (cursors).

        2. AI Proxy Server (Planned):

            This component is not yet built; logic is mocked on the frontend.

            The design requires a separate backend (e.g., Java, Node.js) to act as a secure proxy.

            It would expose an HTTP endpoint (e.g., POST /api/complete).

            This server would be the only part to hold the GEMINI_API_KEY, receive code context from the frontend, call the Google AI SDK, and return suggestions.

# Communication Flow

    [Client 1 (Angular)] <--- (WebSocket) ---> [Backend (Node.js): Yjs Server] <--- (WebSocket) ---> [Client 2 (Angular)]
    |
    | <--- (HTTP POST) ---> [Backend: AI Proxy (Planned)] ---> [Google Gemini API]
    |
    (Mock AI Service) <--- (Current Implementation)

# Getting Started

Prerequisites
Node.js (v18 or higher)
Angular CLI (npm install -g @angular/cli)

    1. Run the Backend (Collaboration Server)

    The y-websocket server is required for real-time text synchronization.

        # Navigate to the backend directory
        cd backend

        # Install dependencies
        npm install

        # Run the server
        node server.js

    The server will be running at ws://localhost:1234.

    2. Run the Frontend (Angular App)
    The Angular app contains the UI and editor.

        # Navigate to the frontend directory
        cd frontend

        # Install dependencies
        npm install

        # Run the development server
        ng serve --open

    The application will open at http://localhost:4200/.

# How to Test

    1. Real-time Collaboration (Yjs)
    This feature is fully functional.

        Open your browser to http://localhost:4200/?room=project-A.

        Open a second browser tab (or an incognito window) and navigate to the same URL: http://localhost:4200/?room=project-A.

        Type in one editor. The text (and your cursor) will appear in real-time in the other window.

        Now, open a third tab and change the URL to a different room: http://localhost:4200/?room=project-B.

        Typing in this third tab will not sync with the other two, proving that session management by "room" is working.

    2. AI Code Completion (Mocked)

        This feature simulates the frontend part of the AI integration.

        In the editor, type a few letters (e.g., cons).

        Press the custom hotkey: Ctrl + . (Control + Dot).

        A completion menu will appear with mocked suggestions (console, console.log, const).

        The hotkey is throttled: if you spam the hotkey, it will only send one request at a time, waiting for the previous (mock) request to complete before sending another.

        Typing text (e.g., function...) will not trigger the completion automatically. It is bound only to the hotkey, as specified by activateOnTyping: false.

# Project Details (as required)

    ## Gemini API Key Configuration (Planned)

        The current implementation uses a mock AiCompletionService and does not require an API key.

        To implement the final solution:

            1. A backend proxy (e.g., Spring Boot or Express.js) would be built.

            2. The GEMINI_API_KEY would be stored securely in an environment variable (.env or application.properties) on that server.

            3. The AiCompletionService in Angular would be refactored to replace of(mockResponse) with an HttpClient.post call to that proxy.

    ## Prompt Engineering & Response Parsing

        Prompt (Request): When the hotkey is pressed, the EditorComponent's customAiCompletion function gathers the code context. The AiCompletionRequest object is built with fullText, cursorPosition, and textBeforeCursor. This payload is sent to the AiCompletionService. A real prompt to Gemini would use this context, e.g.: Complete the code. The user is at the | cursor: \n\n[fullText]\n\n.

        Response Parsing: The component expects the service to return an Observable<AiCompletionResponse>.

        Expected JSON: { "suggestions": [{ "label": "...", "type": "..." }] }

        Parsing: The .then() block of the promise maps this response array into the format required by @codemirror/autocomplete:

        return {
            from: cursorPosition, // Where the completion starts
            options: response.suggestions.map((s) => ({
                label: s.label, // The text to show
                type: s.type, // (e.g., 'function', 'keyword')
                apply: s.label, // The text to insert
            })),
        };

    ## Assumptions & Simplifications

        Mock AI: The most significant simplification. The AiCompletionService returns a static, hard-coded JSON object after a 300ms delay and does not call any external API.

        No Persistence: The y-websocket server stores all documents in memory. If the Node.js server restarts, all data is lost.

        No Auth: Sessions are public and segmented only by the URL query parameter (?room=...).

        Basic Awareness: Cursors are synchronized, but additional user metadata (like names or custom colors) is not yet implemented.

    ## Potential Next Steps

        Build the AI Proxy: Implement the Java/Node.js backend proxy to securely manage the GEMINI_API_KEY and call the @google/generative-ai SDK.

        Activate Real AI: Replace the mock service in AiCompletionService with a real HttpClient module to call the new proxy.

        Add Persistence: Integrate a persistent Yjs provider (like y-leveldb or y-mongodb) into the y-websocket server to save document states.

        Enhance Awareness: Use provider.awareness.setLocalStateField on the frontend to add user names and colors, and display this information in the UI.

        Refine Completions: Improve the from: logic in the customAiCompletion function to replace text from the beginning of the current word, not just from the cursor position.
