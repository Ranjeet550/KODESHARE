# Codeghar - Real-time Code Collaboration Platform

![Codeghar Logo](/client/public/codeghar-icon.svg)

Codeghar is a modern, real-time code collaboration platform that allows developers to share, edit, and execute code together. With features like custom URL code sharing, real-time collaboration, and code execution, Codeghar provides a seamless environment for pair programming and teaching.

## Features

- **Real-time Code Collaboration**: Multiple users can edit code simultaneously with live updates
- **Custom URL Code Sharing**: Create custom URLs for your code snippets
- **Code Execution**: Run code directly in the browser and see the output
- **User Authentication**: Secure login and registration system
- **Dashboard**: Manage your saved code snippets
- **User Profiles**: Personalized user profiles
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Choose your preferred theme

## Tech Stack

### Frontend
- React 19
- React Router DOM
- Tailwind CSS
- Monaco Editor (Code Editor)
- Socket.io Client (Real-time communication)
- Three.js & GSAP (Animations)
- Axios (API requests)

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- Socket.io (Real-time communication)
- JWT Authentication
- bcrypt (Password hashing)

## Color Palette
- Peach: #F1BA88
- Light Yellow-Green: #E9F5BE
- Mint Green: #81E7AF
- Teal: #03A791

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Setup

1. Clone the repository
```bash
git clone https://github.com/Ranjeet550/codeghar.git
cd codeghar
```

2. Install dependencies for the root project, client, and server
```bash
# Root directory
npm install

# Client directory
cd client
npm install

# Server directory
cd ../server
npm install
```

3. Create a `.env` file in the server directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Start the development servers

```bash
# Start the server (from the server directory)
npm run dev

# Start the client (from the client directory)
npm run dev
```

5. Open your browser and navigate to:
- Frontend: http://localhost:5174
- Backend API: http://localhost:5000

## Usage

1. **Create a Code Share**:
   - Visit the homepage
   - Enter a custom URL (optional)
   - Click "Create New Code Share"

2. **Collaborate in Real-time**:
   - Share the generated URL with collaborators
   - Edit code together in real-time

3. **Execute Code**:
   - Write your code in the editor
   - Click the "Run" button to see the output

4. **Save Code Snippets**:
   - Log in to your account
   - Save your code snippets for future reference

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any inquiries, please reach out to the repository owner.

---

Made with ❤️ by [Ranjeet](https://github.com/Ranjeet550)
