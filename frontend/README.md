# Chat Application Frontend

Modern React-based frontend for the chat application, built with Vite 5+ and TypeScript.

## Tech Stack

- **React 18.3** - UI library
- **TypeScript 5.5** - Type safety
- **Vite 5.4** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Zustand 4.5** - State management
- **Socket.IO Client 4.7** - Real-time WebSocket communication
- **Axios 1.7** - HTTP client
- **React Router 6.26** - Client-side routing
- **date-fns 3.6** - Date utility library
- **Heroicons 2.1** - Icon library

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Environment variables:
- `VITE_API_URL` - Backend API URL (default: http://localhost:3000)
- `VITE_WS_URL` - WebSocket server URL (default: http://localhost:3000)

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173

### Building

Build for production:

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Docker Deployment

The frontend is containerized with nginx for production deployment.

### Building the Docker Image

```bash
docker build -t chat-frontend:latest .
```

### Running the Container

```bash
docker run -d \
  -p 80:80 \
  -e VITE_API_URL=http://your-backend:3000/api \
  -e VITE_WS_URL=http://your-backend:3000 \
  --name chat-frontend \
  chat-frontend:latest
```

### Environment Variables (Runtime)

The Docker image supports runtime configuration through environment variables:

- `VITE_API_URL` - Backend API URL (injected at container start)
- `VITE_WS_URL` - WebSocket server URL (injected at container start)
- `APP_NAME` - Application name (optional)
- `VERSION` - Application version (optional)

### Health Check

The nginx server exposes a health check endpoint at `/health`:

```bash
curl http://localhost:80/health
```

### Docker Compose

The frontend is integrated with the full stack via docker-compose.yml:

```bash
docker-compose up frontend
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/       # React components
│   ├── auth/        # Authentication components (Login, Register)
│   └── chat/        # Chat-related components
├── config/          # Configuration files
├── hooks/           # Custom React hooks
├── services/        # API and WebSocket services
├── store/           # Zustand state stores
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
└── index.css        # Global styles
```

## Features

- User authentication (login/register)
- Real-time chat messaging
- Direct and group chats
- Message reactions
- Typing indicators
- Read receipts
- Image sharing
- Message formatting (bold, italic)
- Responsive design

## Development Guidelines

- Follow existing code conventions and patterns
- Use TypeScript for type safety
- Leverage Zustand for state management
- Use React hooks for component logic
- Follow the component structure for organization
