# CampusFix Frontend

This is the frontend application for CampusFix, a comprehensive campus facility management system that allows students and staff to report issues, track their resolution, and participate in campus events.

## Features

- **User Authentication**: Secure login and registration system with role-based access control
- **Issue Reporting**: Report campus facility issues with details, location, and media attachments
- **Issue Tracking**: Track the status of reported issues and receive updates
- **Event Management**: Browse, register for, and manage campus events
- **Admin Dashboard**: Comprehensive dashboard for administrators to manage issues, events, and users
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Technology Stack

- **React**: Frontend library for building user interfaces
- **React Router**: For navigation and routing
- **Material-UI**: Component library for consistent and responsive design
- **Axios**: For API requests
- **Formik & Yup**: For form handling and validation
- **Chart.js**: For data visualization in dashboards
- **date-fns**: For date manipulation and formatting

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory: `cd frontend`
3. Install dependencies: `npm install` or `yarn install`
4. Start the development server: `npm start` or `yarn start`
5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser

### Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React context providers
├── layouts/          # Page layout components
├── pages/            # Page components
│   ├── admin/        # Admin-specific pages
│   ├── auth/         # Authentication pages
│   ├── events/       # Event-related pages
│   ├── issues/       # Issue-related pages
│   └── user/         # User-specific pages
├── services/         # API service functions
├── utils/            # Utility functions
├── App.js            # Main application component
├── index.js          # Application entry point
├── theme.js          # Material-UI theme configuration
└── index.css         # Global styles
```

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.