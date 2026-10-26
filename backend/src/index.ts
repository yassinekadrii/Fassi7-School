import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import dotenv from 'dotenv';

// Import route plugins
import authRoutes from './routes/auth.js';
import coursesRoutes from './routes/courses.js';
import languagesRoutes from './routes/languages.js';
import enrollmentsRoutes from './routes/enrollments.js';
import paymentsRoutes from './routes/payments.js';
import scheduleRoutes from './routes/schedule.js';
import staffRoutes from './routes/staff.js';
import studentsRoutes from './routes/students.js';
import teachersRoutes from './routes/teachers.js';
import inquiriesRoutes from './routes/inquiries.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const server = Fastify({
  logger: true,
});

// Configure CORS for standalone frontend integration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

await server.register(cors, {
  origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});

// Configure Cookies
await server.register(cookie, {
  secret: process.env.JWT_SECRET || 'fassi7_fastify_backend_secret_key_2026_super_secure',
  parseOptions: {},
});

// Health check endpoint
server.get('/health', async () => {
  return { status: 'ok', service: 'fassi7-fastify-backend', timestamp: new Date().toISOString() };
});

server.get('/api/health', async () => {
  return { status: 'ok', service: 'fassi7-fastify-backend', timestamp: new Date().toISOString() };
});

// Register all modular REST route handlers
await server.register(authRoutes, { prefix: '/api/auth' });
await server.register(coursesRoutes, { prefix: '/api/courses' });
await server.register(languagesRoutes, { prefix: '/api/languages' });
await server.register(enrollmentsRoutes, { prefix: '/api/enrollments' });
await server.register(paymentsRoutes, { prefix: '/api/payments' });
await server.register(scheduleRoutes, { prefix: '/api/schedule' });
await server.register(staffRoutes, { prefix: '/api/staff' });
await server.register(studentsRoutes, { prefix: '/api/students' });
await server.register(teachersRoutes, { prefix: '/api/teachers' });
await server.register(inquiriesRoutes, { prefix: '/api/inquiries' });
await server.register(reportsRoutes, { prefix: '/api/reports' });

// Global Error Handler
server.setErrorHandler((error, request, reply) => {
  server.log.error(error);
  reply.status(error.statusCode || 500).send({
    error: error.message || 'Internal Server Error',
  });
});

const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || '0.0.0.0';

try {
  await server.listen({ port, host });
  console.log(`\n🚀 Fassi7 Fastify Backend Server running at http://${host}:${port}`);
  console.log(`📡 CORS configured for Frontend: ${frontendUrl}`);
  console.log(`🏥 Health check: http://localhost:${port}/health\n`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
