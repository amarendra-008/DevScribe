import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import repositoriesRoute from './routes/repositories';
import changelogRoute from './routes/changelog';
import readmeRoute from './routes/readme';
import documentsRoute from './routes/documents';
import syncRoute from './routes/sync';

const app = express();

// CORS configuration
app.use(
  cors({
    origin: [
      'https://devscribe.vercel.app',
      'http://localhost:5173',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get('/', (_req, res) => {
  res.send('DevScribe API is running');
});

// API routes
app.use('/api/repos', repositoriesRoute);
app.use('/api/changelog', changelogRoute);
app.use('/api/readme', readmeRoute);
app.use('/api/documents', documentsRoute);
app.use('/api/sync', syncRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DevScribe backend running on port ${PORT}`);
});
