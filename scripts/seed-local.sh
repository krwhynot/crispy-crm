#!/bin/bash
# Seed local database with test data
echo "🌱 Seeding local database..."
cp .env.local .env
npm run seed:data
