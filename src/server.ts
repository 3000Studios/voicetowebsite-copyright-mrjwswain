import express from 'express';
import helmet from 'helmet';

const app = express();

// Set security headers using helmet
app.use(helmet());

// Other routes and configurations...

export default app;