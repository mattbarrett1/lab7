/**
 * @author Brandon Calvario
 * @author Matthew Barrett
 */
import express from 'express';
//import { redirect } from 'express/lib/response';
import mysql from 'mysql2/promise';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
//process.env.NP_USERNAME
//process.env.NP_PWD
const pool = mysql.createPool({
    host: "sql3.freesqldatabase.com",
    user: "sql3823452",
    password: "HMhkV1Y86q",
    database: "sql3823452",
    connectionLimit: 10,
    waitForConnections: true
});

app.get('/', async (req, res) => {
    try {
        const [authors] = await pool.query(`
            SELECT authorId, firstName, lastName
            FROM authors
            ORDER BY lastName
        `);
        const [categories] = await pool.query(`
            SELECT DISTINCT category
            FROM quotes
            ORDER BY category
        `);

        res.render('home.ejs', { authors, categories });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});
app.get("/dbTest", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});
app.get("/searchByKeyword", async (req, res) => {
    try {
        let keyword = req.query.keyword;
        let sql = `
            SELECT quote, firstName, lastName, authorId
            FROM quotes
            NATURAL JOIN authors
            WHERE quote LIKE ?
        `;
        const [rows] = await pool.query(sql, [`%${keyword}%`]);
        res.render("quotes.ejs", { rows, heading: `Quotes containing "${keyword}"` });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});
app.get("/searchByAuthor", async (req, res) => {
    try {
        let authorId = req.query.authorId;
        let sql = `
            SELECT quote, firstName, lastName, authorId
            FROM quotes
            NATURAL JOIN authors
            WHERE authorId = ?
        `;
        const [rows] = await pool.query(sql, [authorId]);
        const authorName = rows.length > 0 ? `${rows[0].firstName} ${rows[0].lastName}` : "this author";
        res.render("quotes.ejs", { rows, heading: `Quotes by ${authorName}` });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});

app.get("/searchByGender", async (req, res) => {
    try {
        let gender = req.query.gender;
        let sql = `
            SELECT quote, firstName, lastName, authorId
            FROM quotes
            NATURAL JOIN authors
            WHERE sex = ?
        `;
        const [rows] = await pool.query(sql, [gender]);
        const label = gender === 'M' ? 'Male' : 'Female';
        res.render("quotes.ejs", { rows, heading: `Quotes by ${label} authors` });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});

app.get("/searchByCategory", async (req, res) => {
    try {
        let category = req.query.categoryId;
        //console.log(category);
        let sql = `
            SELECT quote, firstName, lastName, authorId
            FROM quotes
            NATURAL JOIN authors
            WHERE category = ?
        `;
        const [rows] = await pool.query(sql, [category]);
        res.render("quotes.ejs", { rows, heading: `${category} quotes` });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});

app.get("/searchByLikes", async (req, res) => {
    try {
        let minimum = req.query.minimum;
        if (minimum == "") {
            minimum = "0";
        }
        let maximum = req.query.maximum;
        if (maximum == "") {
            maximum = 200
            //idk how to do integer.maxvalue but the most amount of likes a single quote has is 156 so... close enough
        }
        let sql = `
            SELECT quote, firstName, lastName, likes, authorId
            FROM quotes
            NATURAL JOIN authors
            WHERE likes BETWEEN ? AND ?
            ORDER BY likes DESC
        `;
        const [rows] = await pool.query(sql, [minimum, maximum]);
        res.render("likes.ejs", { rows, heading: `Quotes by likes` });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});

app.listen(3000, () => {
    console.log("Express server running on http://localhost:3000");
});
//<%-include ('partials/head')%>
//<%-include ('partials/footer')%>

app.get("/api/author/:authorId", async (req, res) => {
    try {
        let authorId = req.params.authorId;
        let sql = `
            SELECT *
            FROM authors
            WHERE authorId = ?
        `;
        const [authorInfo] = await pool.query(sql, [authorId]);
        res.send(authorInfo); //display info in JSON format
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});

app.get("/newQuote", (req, res) => {
    res.render("newQuote.ejs");
});

app.post("/newQuote", async (req, res) => {
    let quote = req.body.quote;
    let authorId = req.body.authorId;
    let category = req.body.category;
    const params = [quote, authorId, category];
    const [rows] = await pool.query("INSERT INTO quotes (quote, authorId, category) VALUES (?, ?, ?)", params);
    
    res.redirect("/");
});


app.get("/newAuthor", (req, res) => {
    res.render("newAuthor.ejs");
});

app.post("/newAuthor", async (req, res) =>  {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let sex = req.body.sex;
    let birthday = req.body.birthday;
    let image = req.body.image;
    const params = [firstName, lastName, sex, birthday, image];
    const [rows] = await pool.query("INSERT INTO authors (firstName, lastName, birthday, sex, portrait) VALUES (1, ?, ?, ?, 1, ?, 1, 1, ?)", params);
    res.redirect("/");
});

app.get('/allAuthors', async (req, res) => {
    let sql = `SELECT authorId, firstName, lastName
               FROM authors
               ORDER BY lastName`;
    const [authors] = await pool.query(sql);
    res.render('allAuthors.ejs', {authors});
});

app.get('/updateAuthor', async (req, res) => {
    let authorId = req.query.authorId;
    let sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') ISOdob
               FROM authors
               WHERE authorId = ?`;
    const [authorInfo] = await pool.query(sql, [authorId]);
    res.render('updateAuthor.ejs', {authorInfo});
});
app.post('/updateAuthor', async (req, res) => {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let sex = req.body.sex;
    let dob = req.body.dob;
    let sql = `UPDATE authors
               SET
               firstName = ?,
               lastName = ?,
               dob = ?,
               sex = ?,
               WHERE authorId = ?`;
    let sqlParams = [firstName, lastName, dob, sex, authorId];
    const [rows] = await pool.query(sql, sqlParams);
    res.redirect("/authors");
});