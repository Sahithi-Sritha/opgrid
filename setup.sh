#!/bin/bash

echo "🚀 OpGrid Setup Script"
echo "======================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo ""

# Frontend setup
echo "📦 Setting up frontend..."
cd frontend
npm install
cp .env.example .env.local
echo "✓ Frontend dependencies installed"
echo "⚠️  Please edit frontend/.env.local with your Supabase credentials"
echo ""
cd ..

# Agent setup
echo "🤖 Setting up agent..."
cd agent
npm install
cp .env.example .env
echo "✓ Agent dependencies installed"
echo "⚠️  Please edit agent/.env with your API keys"
echo ""
cd ..

# Database setup reminder
echo "💾 Database Setup"
echo "=================="
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Run: psql -h <your-host> -U postgres -d postgres -f schema.sql"
echo "3. Or copy the contents of schema.sql into Supabase SQL Editor"
echo ""

# Final instructions
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Configure environment variables:"
echo "   - frontend/.env.local"
echo "   - agent/.env"
echo ""
echo "2. Run the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Run the agent:"
echo "   cd agent && npm run dev"
echo ""
echo "4. Visit http://localhost:3000"
echo ""
echo "📚 See DEPLOYMENT.md for production deployment guide"
