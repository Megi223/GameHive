# GameHive 🎮

**GameHive** is a multiplayer gaming platform built with Node.js and Socket.IO. Currently, it features a Tic-Tac-Toe game with real-time multiplayer functionality.

## 🚀 Features
- 🎮 **Game Menu:** Supports multiple games (currently only Tic-Tac-Toe).
- 🧑‍🤝‍🧑 **Multiplayer:** Real-time gameplay using Socket.IO.
- ❤️ **Player Life System:** 5 lives per player, losing one per game loss, Regain 1 life every minute.
- 🤝 **Virtual Friends:** Add and manage virtual friends to play and compete together.

## 🧰 Libraries Used
### Core Dependencies:
- `express`: Web framework
- `socket.io`: Real-time multiplayer support
- `mongoose`: MongoDB object modeling
- `redis`: Session and life management
- `jsonwebtoken`: User authentication
- `bcrypt`: Password security
- `cloudinary`: Image storage
- `dotenv`: Environment variables
- `ejs`: Templating engine

### Development Tools:
- `nodemon`: Live server reload for development

---
## 📂 File Structure
```
GameHive/
├── config/                 # Configuration files
├── data/                   # Database schemas
├── middlewares/            # Custom middleware for authentication, lives, notifications
├── public/                 # Static assets (CSS, images)
├── routes/                 # API routes (games, users, friends, etc.)
├── views/                  # Frontend templates (EJS)
│   └── partials/           # Shared components (e.g., navbar)
├── .env                    # Environment variables
├── .gitignore              # Ignored files for Git
├── package-lock.json       # Package lock for dependencies
├── package.json            # Project metadata
├── README.md               # Project documentation
├── redisConnection.js      # Redis setup for lives management
├── server.js               # Main server file
└── socketManager.js        # Socket.IO logic for multiplayer
```
---
## 📝 Future Improvements
- [ ] Add more games to the game menu
- [ ] Add ranking and leaderboards
- [ ] Develop daily wheel spin feature with points to buy lives
- [ ] Create leveling

---
## 📜 License
This project is licensed under the MIT License.
