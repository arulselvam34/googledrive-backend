# Google Drive Backend API

Enterprise-grade Google Drive clone backend built with Node.js, Express, MongoDB, and AWS S3.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Storage**: AWS S3
- **Authentication**: JWT (JSON Web Tokens)
- **Encryption**: bcryptjs

## Prerequisites

- Node.js v16+ 
- MongoDB Atlas account
- AWS Account (S3 bucket)
- SMTP-compatible email service

## Installation

1. Clone the repository:
```bash
git clone https://github.com/username/googledrive-backend.git
cd googledrive-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Start the development server:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/logout` - Logout user

### Files & Folders
- `GET /api/files` - List user files/folders
- `POST /api/files/folder` - Create new folder
- `POST /api/files/upload` - Upload file to S3
- `GET /api/files/:fileId` - Get file details
- `DELETE /api/files/:fileId` - Delete file/folder
- `GET /api/files/:fileId/download` - Download file

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/          # Mongoose schemas
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── index.js         # App entry point
```

## Database Schema

### Users Collection
- username (unique email)
- firstName, lastName
- password (encrypted)
- isEmailVerified
- emailVerificationToken
- emailVerificationExpiry
- resetPasswordToken
- resetPasswordExpiry
- createdAt, updatedAt

### Files Collection
- userId (reference to User)
- fileName
- fileType (file/folder)
- s3Key (AWS S3 path)
- parentFolderId
- fileSize
- uploadedAt
- lastModified

## Security Features

- ✅ Password encryption with bcrypt
- ✅ JWT-based authentication
- ✅ Email verification workflow
- ✅ Password reset with token expiry
- ✅ AWS S3 private bucket access
- ✅ CORS protection
- ✅ Input validation and sanitization

## Testing

```bash
npm test
npm run test:watch
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Open Pull Request

## License

MIT
