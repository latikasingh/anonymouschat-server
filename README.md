# Anonymous Chat Backend

A Node.js/Express backend server for anonymous chat application with real-time messaging capabilities.

## Features

- Real-time messaging with Socket.IO
- Anonymous user sessions
- IP-based geolocation
- Message validation and filtering
- MongoDB data persistence
- Email notifications
- Caching system
- CORS enabled

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.IO
- **Authentication**: bcryptjs for password hashing
- **Validation**: Express Validator
- **Caching**: Node Cache
- **Email Service**: Nodemailer
- **HTTP Client**: Axios
- **IP Geolocation**: IPInfo API
- **User Agent Parsing**: UA Parser JS
- **Environment Management**: dotenv
- **CORS**: Express CORS middleware
- **Development**: Nodemon, ts-node

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/chat/messages` - Get chat messages
- `POST /api/chat/send` - Send message
- WebSocket events for real-time communication

## Environment Variables

See `.env` file for required configuration variables including database URI, API keys, and mail settings.

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm start      # Start production server
```

## License

ISC