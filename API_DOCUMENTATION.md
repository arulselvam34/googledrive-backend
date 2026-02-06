# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

## Response Format
```json
{
  "message": "Success message",
  "data": { ... }
}
```

## Error Response
```json
{
  "error": "Error message"
}
```

## Endpoints

### Authentication Endpoints

#### Register
```
POST /auth/register

Request:
{
  "username": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "confirmPassword": "password123"
}

Response (201):
{
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "user_id",
    "username": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Verify Email
```
POST /auth/verify-email

Request:
{
  "token": "verification_token",
  "email": "user@example.com"
}

Response (200):
{
  "message": "Email verified successfully. You can now login."
}
```

#### Login
```
POST /auth/login

Request:
{
  "username": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Forgot Password
```
POST /auth/forgot-password

Request:
{
  "email": "user@example.com"
}

Response (200):
{
  "message": "Password reset link sent to your email"
}
```

#### Reset Password
```
POST /auth/reset-password

Request:
{
  "token": "reset_token",
  "email": "user@example.com",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}

Response (200):
{
  "message": "Password reset successful. You can now login with your new password."
}
```

### File Endpoints

#### Get Files/Folders
```
GET /files?folderId=folder_id (optional)

Headers:
Authorization: Bearer <token>

Response (200):
{
  "files": [
    {
      "id": "file_id",
      "fileName": "document.pdf",
      "fileType": "file",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "isStarred": false,
      "uploadedAt": "2026-02-03T...",
      "lastModified": "2026-02-03T..."
    }
  ]
}
```

#### Create Folder
```
POST /files/folder

Headers:
Authorization: Bearer <token>

Request:
{
  "folderName": "My Documents",
  "parentFolderId": "parent_folder_id" (optional)
}

Response (201):
{
  "message": "Folder created successfully",
  "folder": {
    "id": "folder_id",
    "fileName": "My Documents",
    "fileType": "folder",
    "createdAt": "2026-02-03T..."
  }
}
```

#### Upload File
```
POST /files/upload

Headers:
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request:
{
  "file": <binary>,
  "parentFolderId": "parent_folder_id" (optional)
}

Response (201):
{
  "message": "File uploaded successfully",
  "file": {
    "id": "file_id",
    "fileName": "document.pdf",
    "fileType": "file",
    "fileSize": 1024000,
    "uploadedAt": "2026-02-03T..."
  }
}
```

#### Download File
```
GET /files/:fileId/download

Headers:
Authorization: Bearer <token>

Response (200):
{
  "downloadUrl": "https://s3.amazonaws.com/...",
  "fileName": "document.pdf"
}
```

#### Delete File
```
DELETE /files/:fileId

Headers:
Authorization: Bearer <token>

Response (200):
{
  "message": "File deleted successfully"
}
```

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request body |
| 401 | Unauthorized | Provide valid token |
| 403 | Forbidden | Email not verified |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already registered |
| 500 | Server Error | Contact support |

## Rate Limiting
No rate limiting currently implemented. Add in production:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
```

## Pagination
Future enhancement - currently returns all files

## Sorting
Default sort: `createdAt` descending

## Filtering
Future enhancement - currently no filtering

## Search
Future enhancement - currently no search

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "password123"
  }'
```

### Get Files
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/files
```

### Create Folder
```bash
curl -X POST http://localhost:5000/api/files/folder \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"folderName": "My Documents"}'
```

## Postman Collection

Import this into Postman:
```json
{
  "info": {
    "name": "Google Drive API",
    "version": "1.0"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/auth/register"
      }
    }
  ]
}
```

## Webhooks
Not implemented yet. Can be added for:
- File upload completion
- File deletion
- Account events

## GraphQL
Not implemented. REST API currently used.

## Changelog

### v1.0.0
- Initial release
- Authentication
- File management
- AWS S3 integration
