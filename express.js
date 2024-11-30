const express = require('express');

// Import ObjectId for ID handling
const { MongoClient, ObjectId } = require('mongodb'); 

// Import winston for logging
const winston = require('winston'); 

// Initialize express app using port 3000
const app = express();
const port = 3000;

// Middleware to parse incoming JSON data
app.use(express.json());

// Set up Winston Logger
// Log level (can be 'info', 'warn', 'error', etc.)
const logger = winston.createLogger({
  level: 'info', 
  format: winston.format.combine(
    // Add timestamp to logs
    winston.format.timestamp(), 
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`; 
    })
  ),
  transports: [
    // Output logs to the console
    new winston.transports.Console(), 
    // Log to a file called 'app.log'
    new winston.transports.File({ filename: 'app.log' }) 
  ],
});

// MongoDB connection url 
const url = 'mongodb+srv://mg1415:CW01@cluster0.eyfy3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; 
// Database name 
const dbName = 'courses'; 
// Collection name 
const collectionName = 'coursecollection'; 
let db;

// Connect to MongoDB and initialize the database connection
MongoClient.connect(url)
  .then((client) => {
    logger.info('Connected to MongoDB');

    // Initialize the database
    db = client.db(dbName); 
  })
  .catch((err) => {
    logger.error('Error connecting to MongoDB: ', err);
  });

// Routes

// 1. GET route to retrieve all courses from the "coursecollection" collection
app.get('/courses', async (req, res) => {
  try {
    logger.info('Fetching all courses');
    // Fetch all courses
    const courses = await db.collection(collectionName).find().toArray(); 
    res.json(courses);
  } catch (err) {
    logger.error('Error fetching courses: ', err);
    res.status(500).send('Error fetching courses');
  }
});

// 2. GET route to retrieve a specific course by its ID
app.get('/courses/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Convert the ID string to ObjectId
    const objectId = new ObjectId(id);
    logger.info(`Fetching course with ID: ${id}`);

    // Fetch the course by its ObjectId
    const course = await db.collection(collectionName).findOne({ _id: objectId });

    if (course) {
      // Send course data as a response
      res.json(course); 
    } else {
      logger.warn(`Course with ID: ${id} not found`);
      // Course not found
      res.status(404).send('Course not found'); 
    }
  } catch (err) {
    // Handle invalid ObjectId format or other errors
    logger.error(`Error fetching course with ID: ${id}`, err);
    res.status(400).send('Invalid course ID format');
  }
});

// 3. POST route to create a new course in the "coursecollection" collection
app.post('/courses', async (req, res) => {
  const {  title, location, price, image, availableInventory, rating } = req.body;

  // Validate that title and up to rating are provided
  if (!title || !rating) {
    logger.warn('Course title or rating not provided');
    return res.status(400).send('Course name and rating are required');
  }

  try {
    // Create new course object
    const newCourse = {  title, location, price, image, availableInventory, rating };

    // Insert the new course into the collection
    const result = await db.collection(collectionName).insertOne(newCourse); 
    logger.info('New course created');

    // Respond with the created course
    res.status(201).json(result.ops[0]); 
  } catch (err) {
    logger.error('Error saving course', err);
    res.status(500).send('Error saving course');
  }
});

// 4. PUT route to update a course in the "coursecollection" collection
app.put('/courses/:id', async (req, res) => {
  const { id } = req.params;
  const { title, location, price, image, availableInventory, rating } = req.body;

  // Validate that title up to rating are provided
  if (!title || !rating) {
    logger.warn('Course name or rating not provided for update');
    return res.status(400).send('Course name and rating are required');
  }

  try {
    const objectId = new ObjectId(id); // Convert string ID to ObjectId
    logger.info(`Updating course with ID: ${id}`);

    // Update course information
    const result = await db.collection(collectionName).updateOne(
      { _id: objectId },
      {
        $set: {
          title,
          location,
          image, 
          price, 
          availableInventory,
          rating,
        },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Course with ID: ${id} updated successfully`);
      res.send('Course updated successfully');
    } else {
      logger.warn(`Course with ID: ${id} not found for update`);
      res.status(404).send('Course not found');
    }
  } catch (err) {
    logger.error(`Error updating course with ID: ${id}`, err);
    res.status(500).send('Error updating course');
  }
});

// 5. DELETE route to remove a course from the "coursecollection" collection
app.delete('/courses/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const objectId = new ObjectId(id); // Convert string ID to ObjectId
    logger.info(`Deleting course with ID: ${id}`);

    // Delete the course
    const result = await db.collection(collectionName).deleteOne({ _id: objectId });

    if (result.deletedCount > 0) {
      logger.info(`Course with ID: ${id} deleted successfully`);
      res.send('Course deleted successfully');
    } else {
      logger.warn(`Course with ID: ${id} not found for deletion`);
      res.status(404).send('Course not found');
    }
  } catch (err) {
    logger.error(`Error deleting course with ID: ${id}`, err);
    res.status(500).send('Error deleting course');
  }
});

// Start the Express server
app.listen(port, () => {
  logger.info(`Server running on http://localhost:${port}`);
});
