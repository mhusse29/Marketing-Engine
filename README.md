# Marketing Engine

A modern AI-powered marketing content generation app built with React, TypeScript, and Vite.

## Features

- **Settings Drawer**: Configure your campaign settings before generating content
  - Media Planner with budget allocation and performance projections
  - Multi-platform support (Facebook, Instagram, TikTok, LinkedIn, Google)
  - Customizable content cards with quick properties
  - A/B testing with version control

- **AI Content Generation**: 
  - Brief-based content generation with image upload support
  - Platform-specific content optimization
  - Picture prompts and enhancement suggestions
  - Video script generation with beat breakdowns

- **Beautiful UI**:
  - Dark theme with accent gradients
  - Smooth animations and transitions
  - Responsive design
  - Accessible components

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd "/Users/mohamedhussein/Desktop/Marketing Engine"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Configure Settings**: Click the Settings button to open the drawer
   - Set your media plan (budget, market, goal, currency)
   - Select target platforms
   - Choose which content cards to generate
   - Configure quick properties for each card type
   - Select number of versions (1 or 2 for A/B testing)

2. **Generate Content**: 
   - Complete all required settings to unlock the AI box
   - Enter a campaign brief (minimum 10 characters)
   - Optionally upload reference images (up to 5)
   - Click Generate to create content

3. **Review & Export**:
   - Review generated content across different platforms
   - Save individual cards
   - Regenerate specific cards as needed
   - Copy content to clipboard

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Framer Motion** for animations
- **Lucide React** for icons

## Project Structure

```
src/
├── components/         # React components
│   ├── AskAI/         # AI generation components
│   ├── Cards/         # Output card components
│   └── SettingsDrawer/# Settings configuration
├── store/             # State management
├── types/             # TypeScript types
├── lib/               # Utilities
└── theme.css          # Global theme variables
```

## Development

### Building for Production

```bash
npm run build
```

### Type Checking

```bash
npm run tsc
```

### Preview Production Build

```bash
npm run preview
```

## License

This project is private and proprietary.