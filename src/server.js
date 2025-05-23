import './validateEnv.js'
import express from 'express'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import shortenerRoute from './routes/urlShortenerRoute.js'
import redirectRoute from './routes/redirectRoute.js'
import { validateUrlRequest } from './middlewares/urlShortenerlMiddleware.js'
import { createTables } from './database/migrations.js'
import { pool } from './database/pool.js'
import { errorHandler } from './middlewares/errorHandlerMidleware.js'
import { fileURLToPath } from 'url';
import path from 'path';

const app = express()
const port = process.env.PORT || 3000

const corsOptions = {
  origin: process.env.ORIGIN,
  methods: ['GET', 'POST'],
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
})


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.json())
app.use(cors(corsOptions))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.render('index')
})

app.use('/', redirectRoute)

app.use(
  '/api/shorten',
  validateUrlRequest,
  limiter,
  shortenerRoute,
)

app.use(errorHandler)

pool
  .connect()
  .then((client) => {
    console.log('Conectado ao banco de dados PostgreSQL!')
    client.release()

    createTables()
  })
  .catch((err) => {
    console.error('Erro ao conectar com o banco de dados', err)
  })

app.listen(
  {
    port,
    host: '0.0.0.0',
  },
  () => {
    console.log('Server stated!!!')
  },
)
