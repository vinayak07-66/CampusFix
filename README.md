# CampusFix - Campus Facility Management System

<p align="center">
  <img src="https://i.ibb.co/WNJMKrDy/College-Logo.jpg" alt="College Logo" width="200">
</p>

## Project Overview
CampusFix is a comprehensive web-based platform designed to streamline the reporting and management of campus facility issues while also providing a platform for campus event management. The system allows students and staff to report problems, upload media evidence, and track the status of their reports. Administrators can efficiently manage, assign, and resolve reported issues through a dedicated dashboard, as well as organize and manage campus events.

## Key Features

### For All Users
- Secure login and registration system
- Profile management with personal information updates
- Event browsing and registration capabilities
- User-friendly, responsive interface

### For Students and Staff
- Issue reporting with image and video upload capability
- Real-time status tracking of reported issues
- Comment and feedback on issue resolution
- Event participation with registration management

### For Administrators
- Comprehensive dashboard with system statistics and analytics
- User management with role assignment
- Issue management with assignment, prioritization, and resolution tracking
- Event creation, editing, and attendee management
- Advanced analytics and reporting tools

## Technology Stack

### Frontend
- React.js with hooks and context API
- Material-UI for responsive design
- React Router for navigation
- Formik & Yup for form handling and validation
- Chart.js for data visualization
- Axios for API requests

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for secure authentication
- Multer for file uploads
- Role-based access control
- RESTful API design

## Installation and Setup
1. Clone the repository
2. Install dependencies for both frontend and backend
3. Configure environment variables
4. Start the development servers

Detailed setup instructions are available in the respective frontend and backend directories.

## Project Structure
```
CampusFix/
├── frontend/             # React frontend application
│   ├── public/          # Static files
│   └── src/             # React source code
│       ├── components/  # Reusable UI components
│       ├── contexts/    # React context providers
│       ├── layouts/     # Page layout components
│       ├── pages/       # Page components
│       ├── services/    # API service functions
│       ├── utils/       # Utility functions
│       ├── App.js       # Main application component
│       └── index.js     # Application entry point
│
├── backend/             # Node.js/Express backend API
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
│
├── .gitignore          # Git ignore file
├── README.md           # Project documentation
```

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.