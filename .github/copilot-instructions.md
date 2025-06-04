# DivSplit - Copilot Instructions

## Project Overview
DivSplit is a expense splitting application built with a modern web stack.

## Directory Structure
- This project uses npm workspaces defined in the root `package.json`
- The `frontend` folder corresponds to the frontend workspace
- The `frontend` folder contains a Vite React application using:
  - React 19
  - React Router for navigation
  - Tailwind CSS for styling
  - i18next for internationalization
- The `backend` folder corresponds to the backend workspace (currently minimal setup)

## Development Setup
- Run the development server: `npm run dev` (from root) or `npm run dev --workspace frontend`
- Frontend runs on `http://localhost:5173`
- The project uses Prettier for code formatting: `npm run format`

## Application Routes
The application uses React Router with the following route structure:
- `/` - Home page
- `/group/:groupId/:section/:sectionItem?` - Group pages with dynamic sections

## Transactions
- To create a new transaction: `http://localhost:5173/group/67141168c590fd4767a79f04/transactions/new`
- On the transaction page, there is a button to load sample data
- Sample data is available in `frontend/demo_data.json` which includes:
  - Group header information
  - Member details with prepaid amounts
  - Sample transactions
  - Group configuration

## Key Features
- Group expense management
- Member management with prepaid balances
- Transaction tracking
- Internationalization support (English and Portuguese)
- Local storage for data persistence (using localforage)

## Technology Stack
- **Frontend**: React 19, Vite, React Router, Tailwind CSS
- **Icons**: React Icons
- **State Management**: React Context (GroupContext, ThemeContext)  
- **Storage**: LocalForage for client-side persistence
- **Internationalization**: i18next with browser language detection
- **Build Tool**: Vite
- **Package Manager**: npm with workspaces
