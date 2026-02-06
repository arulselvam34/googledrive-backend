const express = require('express');
const mongoose = require('mongoose');
const { testS3Connection } = require('../services/s3ServiceV3');
const nodemailer = require('nodemailer');
const router = express.Router();

// Health check for all services
router.get('/health', async (req, res) => {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    status: 'OK',
    services: {}
  };

  try {
    // 1. Database Check
    try {
      const dbState = mongoose.connection.readyState;
      healthStatus.services.database = {
        status: dbState === 1 ? 'Connected' : 'Disconnected',
        state: dbState,
        host: mongoose.connection.host
      };
    } catch (error) {
      healthStatus.services.database = {
        status: 'Error',
        error: error.message
      };
    }

    // 2. AWS S3 Check
    try {
      const s3Status = await testS3Connection();
      healthStatus.services.s3 = {
        status: s3Status.status,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
        ...(s3Status.error && { error: s3Status.error })
      };
    } catch (error) {
      healthStatus.services.s3 = {
        status: 'Error',
        error: error.message
      };
    }

    // 3. Email Service Check
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.verify();
      healthStatus.services.email = {
        status: 'Connected',
        service: process.env.SMTP_SERVICE,
        user: process.env.SMTP_USER
      };
    } catch (error) {
      healthStatus.services.email = {
        status: 'Error',
        error: error.message
      };
    }

    // 4. Environment Variables Check
    const requiredEnvVars = [
      'MONGODB_URI', 'JWT_SECRET', 'AWS_ACCESS_KEY_ID', 
      'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME', 
      'SMTP_USER', 'SMTP_PASS'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    healthStatus.services.environment = {
      status: missingVars.length === 0 ? 'OK' : 'Missing Variables',
      missing: missingVars,
      loaded: requiredEnvVars.length - missingVars.length
    };

    // Overall status
    const hasErrors = Object.values(healthStatus.services).some(
      service => service.status === 'Error' || service.status === 'Disconnected'
    );
    
    if (hasErrors) {
      healthStatus.status = 'DEGRADED';
    }

    res.status(hasErrors ? 503 : 200).json(healthStatus);

  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;