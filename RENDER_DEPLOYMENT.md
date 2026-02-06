# Render Deployment Guide

## Backend Setup on Render

### Step 1: Prepare Your Repository
1. Push your code to GitHub (if not already done)
2. Ensure your `.gitignore` excludes `node_modules` and `.env`

### Step 2: Create Backend Service on Render
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `codeshare-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if needed)

### Step 3: Set Environment Variables
In Render dashboard, go to your service → Environment:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://Ranjeet:SoGEUgDZSFEIZmrC@cluster0.txsr4.mongodb.net/codeshare
JWT_SECRET=cd4d3140f79ee1f417dd328ccef49ba1594adbb2ea169065e988d8a9faa8fd07
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=shivom.chandrakala@gmail.com
EMAIL_PASS=pqrmojcibzexjbzh
FRONTEND_URL=https://your-frontend-url.onrender.com
```

### Step 4: Deploy Frontend on Render
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `codeshare-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`

### Step 5: Update Frontend Environment
After frontend is deployed, update `client/.env`:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

Replace `your-backend-url` with your actual Render backend URL (e.g., `codeshare-backend.onrender.com`)

### Step 6: Update Backend CORS
After frontend is deployed, update `server/.env`:
```
FRONTEND_URL=https://your-frontend-url.onrender.com
```

Replace `your-frontend-url` with your actual Render frontend URL

### Important Notes

- **Free Tier Limitations**: Free services spin down after 15 minutes of inactivity
- **MongoDB**: Ensure your MongoDB Atlas IP whitelist includes Render's IP (or allow all: 0.0.0.0/0)
- **Email Service**: Gmail app passwords work with nodemailer
- **Socket.io**: Works on Render with proper CORS configuration
- **Build Time**: First deployment may take 5-10 minutes

### Troubleshooting

**Service won't start:**
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

**CORS errors:**
- Verify `FRONTEND_URL` matches your frontend domain exactly
- Check that frontend is making requests to correct backend URL

**Socket.io connection issues:**
- Ensure CORS is properly configured in `index.js`
- Check browser console for connection errors

### Monitoring

- View logs: Service → Logs
- Check metrics: Service → Metrics
- Set up alerts: Service → Alerts
