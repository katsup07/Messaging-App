require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { setMessageRoutes } = require('./routes/messageRoutes');
const { setAuthRoutes } = require('./routes/authRoutes');
const { setFriendsRoutes } = require('./routes/friendsRoutes');
const { setFriendRequestRoutes } = require('./routes/friendRequestRoutes');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

setMessageRoutes(app);
setAuthRoutes(app);
setFriendsRoutes(app);
setFriendRequestRoutes(app);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});