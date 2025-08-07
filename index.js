const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()


const mongoose = require('mongoose')
const User = require('./UserSchema.js')
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err))

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/public', express.static(process.cwd() + '/public'))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  if(!username){
    res.status(400).json({ error: 'Username is required' });
    return;
  }
  else{

    try {
      const user = new User({ username });
      await user.save();
      res.status(201).json({ username: user.username, _id: user._id });

    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Error creating user' });
    }

  }
});



app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, { username: 1, _id: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }
  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const exerciseDate = date ? new Date(date) : new Date();
    const formattedDate = exerciseDate.toISOString().split('T')[0];
    const exercise = {
      description,
      duration: Number(duration),
      date: formattedDate // Store date in YYYY-MM-DD format
    };
    user.log.push(exercise);
    user.count += 1;
    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: formattedDate
    });
  } catch (error) {
    console.error('Error adding exercise:', error);
    res.status(500).json({ error: 'Error adding exercise' });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let log = user.log;

    if (from) {
      const fromDate = new Date(from);
      log = log.filter(exercise => new Date(exercise.date) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      log = log.filter(exercise => new Date(exercise.date) <= toDate);
    }

    if (limit) {
      log = log.slice(0, parseInt(limit));
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length, // The count of the returned logs
      log: log.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        // THIS IS THE CORRECTED LINE:
        date: new Date(exercise.date).toDateString()
      }))
    });
  } catch (error) {
    console.error('Error fetching user logs:', error);
    res.status(500).json({ error: 'Error fetching user logs' });
  }
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
