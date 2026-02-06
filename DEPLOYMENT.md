# Backend Deployment Guide

## Prerequisites

- Node.js v16+
- MongoDB Atlas account
- AWS Account with S3 bucket
- SMTP email service (Gmail, SendGrid, etc.)

## Environment Setup

### 1. MongoDB Atlas Setup
1. Create a cluster on MongoDB Atlas
2. Create a database user
3. Whitelist your IP
4. Get connection string
5. Set `MONGODB_URI` in `.env`

### 2. AWS S3 Setup
1. Create an S3 bucket (keep it PRIVATE)
2. Generate IAM access keys
3. Update bucket policy for private access only
4. Set the following in `.env`:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_S3_BUCKET_NAME`

### 3. Email Configuration
1. Set up SMTP service (Gmail, SendGrid, etc.)
2. Update in `.env`:
   - `SMTP_SERVICE`
   - `SMTP_USER`
   - `SMTP_PASS`

### 4. JWT Configuration
1. Generate a secure JWT secret (min 32 characters)
2. Set `JWT_SECRET` in `.env`

## Local Testing

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5000`

## Production Deployment

### Option 1: Heroku

```bash
heroku create googledrive-backend
heroku config:set MONGODB_URI=<your_mongodb_uri>
heroku config:set JWT_SECRET=<your_jwt_secret>
# ... set all other env vars
git push heroku main
```

### Option 2: AWS EC2

```bash
# Launch EC2 instance
# SSH into instance
git clone <repo>
cd googledrive-backend
npm install
npm start  # or use PM2
```

### Option 3: Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Build and push to DockerHub/ECR

### Option 4: Railway/Render

1. Connect your GitHub repository
2. Set environment variables
3. Deploy

## Database Indexing

Run these commands in MongoDB Atlas:

```javascript
// User indexes
db.users.createIndex({ username: 1 })
db.users.createIndex({ emailVerificationToken: 1 })
db.users.createIndex({ resetPasswordToken: 1 })

// File indexes
db.files.createIndex({ userId: 1, parentFolderId: 1 })
db.files.createIndex({ userId: 1, createdAt: -1 })
```

## Security Checklist

- [ ] JWT_SECRET is at least 32 characters
- [ ] CORS whitelist only allows frontend URL
- [ ] S3 bucket is set to PRIVATE
- [ ] Database credentials are secure
- [ ] HTTPS enabled in production
- [ ] Rate limiting configured
- [ ] API validation implemented
- [ ] Error messages don't leak sensitive info

## Monitoring

Use services like:
- **Sentry** for error tracking
- **Datadog** for monitoring
- **LogRocket** for user session replay
- **PM2** for process management

## API Health Check

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-02-03T...",
  "uptime": 123.45
}
```

## Troubleshooting

### MongoDB Connection Error
- Check connection string
- Verify IP whitelist
- Check credentials

### S3 Upload Fails
- Verify IAM permissions
- Check bucket name
- Verify AWS credentials
- Check bucket CORS policy

### Email Not Sending
- Verify SMTP credentials
- Check SMTP service settings
- Review email logs
- Check spam folder

## Performance Optimization

1. Enable MongoDB compression
2. Use AWS CloudFront for S3
3. Implement API caching
4. Use connection pooling
5. Enable gzip compression

## Backup Strategy

1. MongoDB Atlas automated backups
2. S3 versioning enabled
3. Regular export of critical data
4. Test restore procedures

## Version Control

Always maintain:
- `.env.example` with placeholder values
- Git history of all deployments
- Changelog for each version
