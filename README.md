# UAT Viewer

A modern React application built with Vite.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- pnpm

### Installation

Install dependencies:
```bash
pnpm install
```

### Development

Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Supabase

Create a `.env` file in the project root (you can copy values from `env.example`):

```bash
cp env.example .env
```

By default the app reads from the `uat` table (configurable via `VITE_SUPABASE_TABLE`).

### Import `aerplus.json` into Supabase

This will import all rows from `src/data/aerplus.json` into the `uat` table (matching columns by property name):

```bash
pnpm import:uat
```

Notes:
- If it fails with RLS/policy errors, allow INSERT/UPSERT for your key (or disable RLS for table `uat`).
- Default mode is **insert**. If you want **upsert** by `case_id`, set `UAT_IMPORT_MODE=upsert` and ensure `uat.case_id` has a UNIQUE/PRIMARY KEY constraint.
- If your `uat.test_steps` column is `text` (not `text[]`/`jsonb`), set `UAT_TEST_STEPS_AS=text` in your `.env`.

### Build

Build for production:
```bash
pnpm build
```

### Preview

Preview the production build:
```bash
pnpm preview
```

## Tech Stack

- **React 18** - UI library
- **Vite 5** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library built with Radix UI and Tailwind CSS
- **Lucide React** - Beautiful & consistent icon toolkit
- **Supabase** - Backend and database
- **ESLint** - Code linting

## UI Components

This project uses **shadcn/ui** components for a professional, modern interface:

- **Table** - Data display with sorting and filtering
- **Card** - Content containers with header, body, and footer
- **Input** - Text input fields with consistent styling
- **Select** - Dropdown select components
- **Combobox** - Autocomplete dropdown with search functionality
- **Badge** - Status indicators (Pass/Fail/Pending)
- **Button** - Interactive buttons with multiple variants
- **Command** - Command menu component for search and filtering
- **Popover** - Floating content containers

All components are fully customizable and built with accessibility in mind.

## Features

- **Statistics Dashboard** - Real-time overview of test cases by status (Total, Pass, Fail, Pending) with percentage
- **Advanced Filtering** - Filter test cases by module and status
- **Autocomplete Search** - Module filter with autocomplete/search capability
- **Real-time Search** - Search across case ID, module, test case, and results
- **Full Edit Functionality** - Edit all test case fields including:
  - Case ID
  - Module
  - Test Case description
  - Test Steps (multi-line)
  - Expected Result
  - Actual Result
  - Status (Pass/Fail/Pending)
  - Notes
- **Toast Notifications** - Success and error feedback for user actions
- **Expandable Rows** - Click to view detailed test steps, actual results, and notes
- **Status Badges** - Visual indicators for Pass/Fail/Pending status with color coding
- **Skeleton Loading** - Professional loading states with animated skeletons
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Empty States** - Helpful messages when no data is available
