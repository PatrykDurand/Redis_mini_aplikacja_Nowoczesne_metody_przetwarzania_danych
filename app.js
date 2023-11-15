const express = require('express');
const bodyParser = require('body-parser');
const IORedis = require('ioredis');

const app = express();
const port = 3000;
const redisClient = new IORedis({ host: 'localhost', port: 6379 });

redisClient.on('error', (err) => {
    console.error(`Redis Error: ${err}`);
});

app.use(bodyParser.json());


app.post('/add_university', async (req, res) => {
    try {
        const { name, rating } = req.body;


        if (!redisClient.status === 'ready') {
            return res.status(500).json({ error: 'Błąd Redis: Klient zamknięty.' });
        }

        // Sprawdź, czy uczelnia już istnieje
        const exists = await redisClient.exists(name);

        if (exists) {
            return res.status(400).json({ error: 'Uczelnia już istnieje w bazie danych.' });
        }

        // Dodaj uczelnię
        await redisClient.hset(name, 'rating', rating);

        return res.status(201).json({ message: 'Uczelnia dodana do bazy danych.' });
    } catch (error) {
        return res.status(500).json({ error: error.toString() });
    }
});

app.get('/get_universities', async (req, res) => {
    try {
        const universities = [];

        // Pobieranie wszytkich kluczy
        const keys = await redisClient.keys('*');

        for (const key of keys) {
            const university = { name: key, rating: await redisClient.hget(key, 'rating') };
            universities.push(university);
        }

        return res.json({ universities });
    } catch (error) {
        return res.status(500).json({ error: error.toString() });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
