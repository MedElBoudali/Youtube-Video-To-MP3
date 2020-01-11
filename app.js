const express = require('express');
const flash = require("connect-flash");
const session = require('express-session');
const path = require('path');
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

app.set('io', io);

const PORT = process.env.PORT || 3000;

let webSocketClients = [];

io.on("connection", socket => {
    app.set('sockedID', socket.id);
    socket.join(socket.id);
    socket.on("disconnect", socket => console.log(`Disconected ${socket.id}`));
});

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'I have not failed. I\'ve just found 10,000 ways that won\'t work',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());

app.use((req, res, next) => {
    res.locals.invalidURL = req.flash('invalidURL');
    next();
});

//@Routes
app.use('/', require('./models/routes/home'));

http.listen(PORT, () => console.log('Connected'));
