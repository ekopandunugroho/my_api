const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger'); // Menggunakan file swagger.js yang telah Anda buat
const logger = require('./logger'); // Impor logger yang sudah dibuat

const app = express();
const PORT = process.env.PORT || 3000;

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (!isPasswordValid) {
          return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});



// Middleware
app.use(bodyParser.json());

function requireRole(role) {
    return (req, res, next) => {
      if (req.user && req.user.role === role) {
        return next();
      } else {
        res.status(403).json({ message: 'Unauthorized' });
      }
    };
  }
  
  // Contoh penggunaan middleware otorisasi
  app.get('/api/admin', passport.authenticate('jwt', { session: false }), requireRole('admin'), (req, res) => {
    // Handler untuk endpoint yang memerlukan peran 'admin'
  });
  

  // Contoh penggunaan logger untuk mencatat kesalahan
app.get('/api/error', (req, res) => {
    logger.error('Something went wrong');
    res.status(500).json({ message: 'Internal Server Error' });
  });


// Routes

// Endpoint untuk registrasi pengguna
app.post('/api/register', async (req, res) => {
    const { email, gender, password, role } = req.body;
  
    try {
      const existingUser = await User.findOne({ where: { email } });
  
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      const hashedPassword = bcrypt.hashSync(password, 10);
  
      const newUser = await User.create({ email, gender, password: hashedPassword, role });
      res.json(newUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Endpoint untuk login pengguna
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err || !user) {
        return res.status(401).json({ message: 'Authentication failed' });
      }
  
      req.login(user, { session: false }, (err) => {
        if (err) {
          res.send(err);
        }
  
        const token = jwt.sign({ user_id: user.id }, 'eko_pandu');
        return res.json({ user, token });
      });
    })(req, res, next);
  });


const { User, Movie } = require('./models');

// Endpoint untuk mendapatkan semua pengguna
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint untuk membuat pengguna baru
app.post('/api/users', async (req, res) => {
  const { email, gender, password, role } = req.body;

  try {
    const user = await User.create({ email, gender, password, role });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint untuk menghapus pengguna berdasarkan ID
app.delete('/api/users/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint untuk memperbarui pengguna berdasarkan ID
app.put('/api/users/:id', async (req, res) => {
  const id = req.params.id;
  const { email, gender, password, role } = req.body;

  try {
    let user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = email;
    user.gender = gender;
    user.password = password;
    user.role = role;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint untuk mendapatkan semua film
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.findAll();
    res.json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint untuk membuat film baru
app.post('/api/movies', async (req, res) => {
  const { title, genres, year } = req.body;

  try {
    const movie = await Movie.create({ title, genres, year });
    res.json(movie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint untuk menghapus film berdasarkan ID
app.delete('/api/movies/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    await movie.destroy();
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint untuk memperbarui film berdasarkan ID
app.put('/api/movies/:id', async (req, res) => {
  const id = req.params.id;
  const { title, genres, year } = req.body;

  try {
    let movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    movie.title = title;
    movie.genres = genres;
    movie.year = year;

    await movie.save();

    res.json(movie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint untuk mendapatkan daftar pengguna dengan pagination
app.get('/api/users', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10; // Jumlah data per halaman, default 10
    const page = parseInt(req.query.page) || 1; // Halaman yang diminta, default 1
    const offset = (page - 1) * limit; // Menghitung offset
  
    try {
      const users = await User.findAndCountAll({
        limit,
        offset,
      });
  
      res.json({
        totalUsers: users.count,
        totalPages: Math.ceil(users.count / limit),
        currentPage: page,
        users: users.rows,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // Endpoint untuk mendapatkan daftar film dengan pagination
  app.get('/api/movies', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10; // Jumlah data per halaman, default 10
    const page = parseInt(req.query.page) || 1; // Halaman yang diminta, default 1
    const offset = (page - 1) * limit; // Menghitung offset
  
    try {
      const movies = await Movie.findAndCountAll({
        limit,
        offset,
      });
  
      res.json({
        totalMovies: movies.count,
        totalPages: Math.ceil(movies.count / limit),
        currentPage: page,
        movies: movies.rows,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

// Middleware untuk menampilkan dokumentasi Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Middleware
app.use(bodyParser.json());

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Operasi-operasi terkait pengguna
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Mendapatkan daftar pengguna
 *     description: Mengambil daftar semua pengguna dari database.
 *     responses:
 *       200:
 *         description: Daftar pengguna berhasil diambil
 *       500:
 *         description: Terjadi kesalahan server
 */
app.get('/api/users', async (req, res) => {
  // Logika untuk mengambil daftar pengguna
  res.json(users);
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Membuat pengguna baru
 *     description: Membuat pengguna baru berdasarkan data yang diberikan.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Pengguna berhasil dibuat
 *       400:
 *         description: Permintaan tidak valid
 *       500:
 *         description: Terjadi kesalahan server
 */
app.post('/api/users', async (req, res) => {
  // Logika untuk membuat pengguna baru
  res.json(newUser);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Memperbarui pengguna
 *     description: Memperbarui pengguna berdasarkan ID dengan data yang diberikan.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID pengguna yang akan diperbarui
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Pengguna berhasil diperbarui
 *       404:
 *         description: Pengguna tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
app.put('/api/users/{id}', async (req, res) => {
  // Logika untuk memperbarui pengguna
  res.json(updatedUser);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Menghapus pengguna
 *     description: Menghapus pengguna berdasarkan ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID pengguna yang akan dihapus
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pengguna berhasil dihapus
 *       404:
 *         description: Pengguna tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
app.delete('/api/users/{id}', async (req, res) => {
  // Logika untuk menghapus pengguna
  res.json({ message: 'User deleted successfully' });
});

/**
 * @swagger
 * tags:
 *   name: Movies
 *   description: Operasi-operasi terkait film
 */

/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: Mendapatkan daftar film
 *     description: Mengambil daftar semua film dari database.
 *     responses:
 *       200:
 *         description: Daftar film berhasil diambil
 *       500:
 *         description: Terjadi kesalahan server
 */
app.get('/api/movies', async (req, res) => {
  // Logika untuk mengambil daftar film
  res.json(movies);
});

/**
 * @swagger
 * /api/movies:
 *   post:
 *     summary: Membuat film baru
 *     description: Membuat film baru berdasarkan data yang diberikan.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Movie'
 *     responses:
 *       201:
 *         description: Film berhasil dibuat
 *       400:
 *         description: Permintaan tidak valid
 *       500:
 *         description: Terjadi kesalahan server
 */
app.post('/api/movies', async (req, res) => {
  // Logika untuk membuat film baru
  res.json(newMovie);
});

/**
 * @swagger
 * /api/movies/{id}:
 *   put:
 *     summary: Memperbarui film
 *     description: Memperbarui film berdasarkan ID dengan data yang diberikan.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID film yang akan diperbarui
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Movie'
 *     responses:
 *       200:
 *         description: Film berhasil diperbarui
 *       404:
 *         description: Film tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
app.put('/api/movies/{id}', async (req, res) => {
  // Logika untuk memperbarui film
  res.json(updatedMovie);
});

/**
 * @swagger
 * /api/movies/{id}:
 *   delete:
 *     summary: Menghapus film
 *     description: Menghapus film berdasarkan ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID film yang akan dihapus
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Film berhasil dihapus
 *       404:
 *         description: Film tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
app.delete('/api/movies/{id}', async (req, res) => {
  // Logika untuk menghapus film
  res.json({ message: 'Movie deleted successfully' });
});


// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
