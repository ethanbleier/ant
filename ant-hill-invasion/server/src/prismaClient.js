// server/src/prismaClient.js
import { PrismaClient } from '@prisma/client';

//  A single (singleton) Prisma client for the whole backend. 
export const prisma = new PrismaClient();
