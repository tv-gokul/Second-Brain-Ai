-- Run this once against your database before `npm run db:push`.
-- Prisma can create the table shape, but the pgvector extension itself
-- needs to be enabled with superuser privileges first.
CREATE EXTENSION IF NOT EXISTS vector;
