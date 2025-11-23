# TradeLens - Professional Trading Journal & Analytics Platform

A comprehensive trading journal and analytics platform built with React, TypeScript, and Supabase.

## Features

- 📊 **Advanced Analytics** - Comprehensive trading performance analysis
- 📝 **Trade Journaling** - Detailed trade logging with notes and images
- 🏆 **Community Leaderboard** - Compare performance with other traders
- 🤖 **AI-Powered Insights** - Get intelligent trading analysis
- 📈 **Strategy Management** - Track and analyze trading strategies
- 🔐 **Secure Authentication** - User management with Supabase Auth
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Charts**: Recharts
- **State Management**: TanStack Query
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lingesh369/tradelens.git
cd tradelens
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your Supabase credentials in `.env`:
   - Replace `your-project-id` with your actual Supabase project ID
   - Replace `your-anon-key-here` with your actual Supabase anonymous key
   - You can find these values in your Supabase project dashboard

   **Important**: Never commit the `.env` file to version control as it contains sensitive credentials.

5. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── services/      # API services
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── lib/           # Library configurations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
