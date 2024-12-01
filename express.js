// Import necessary packages
// Import Express framework for building the server
const express = require('express');  
// Import MongoDB client and ObjectId utility for database interaction
const { MongoClient, ObjectId } = require('mongodb');  
// Import Winston for logging server activities
const winston = require('winston');  
// Import CORS middleware to enable Cross-Origin Resource Sharing
const cors = require('cors');  

// Initialize Express application and configure server settings
// Initialize the Express application
const app = express();  
// Define the port for the server to run on
const port = 3000;  

// Middleware setup
// Middleware to parse incoming JSON data into JavaScript objects
app.use(express.json());  
// Middleware to enable CORS for all requests, allowing cross-origin requests
app.use(cors());  

// Set up Winston Logger for logging server activities
const logger = winston.createLogger({
// Set the logging level to 'info'
  level: 'info',  
// Combine multiple log formats
  format: winston.format.combine(  
// Add timestamp to each log entry
    winston.format.timestamp(),  
    winston.format.printf(({ timestamp, level, message }) => {
// Format the log message with timestamp and log level
      return `${timestamp} [${level}]: ${message}`;  
    })
  ),
  transports: [
// Log to the console
    new winston.transports.Console(),  
// Log to a file named 'app.log'
    new winston.transports.File({ filename: 'app.log' })  
  ],
});

// MongoDB connection setup
// MongoDB connection URL
const url = 'mongodb+srv://mg1415:CW01@cluster0.eyfy3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';  
// MongoDB database name
const dbName = 'courses';  
// MongoDB collection name
const collectionName = 'coursecollection';  
// Variable to store the database connection
let db;  

// Connect to MongoDB and set up the database connection
MongoClient.connect(url)
  .then((client) => {
// Log successful connection
    logger.info('Connected to MongoDB');  
// Set the 'db' object to the connected database
    db = client.db(dbName);  
  })
  .catch((err) => {
    // Log any errors during the connection
    logger.error('Error connecting to MongoDB: ', err);  
  });

// GET route to fetch all courses from the database
app.get('/courses', async (req, res) => {
  try {
// Log that we are fetching all courses
    logger.info('Fetching all courses');  
// Retrieve all courses from the collection
    const courses = await db.collection(collectionName).find().toArray();  

    // Return the courses as JSON, converting MongoDB ObjectId to string for easier handling on the frontend
    res.json(courses.map(course => ({
      // Convert _id to string
      id: course._id.toString(),  
      title: course.title,
      location: course.location,
      price: course.price,
      image: course.image,
      availableInventory: course.availableInventory,
      rating: course.rating
    })));
  } catch (err) {
// Log any errors
    logger.error('Error fetching courses: ', err);  
// Send error response if something goes wrong
    res.status(500).send('Error fetching courses');  
  }
});

// GET route to fetch a specific course by its ID
app.get('/courses/:id', async (req, res) => {
  // Extract the course ID from the URL parameters
    const { id } = req.params;  
  
    try {
      // Convert string ID to MongoDB ObjectId
      const objectId = new ObjectId(id);  
      // Log the course ID being fetched
      logger.info(`Fetching course with ID: ${id}`);  
  // Find the course by ID
      const course = await db.collection(collectionName).findOne({ _id: objectId });  
  
      if (course) {
        // Return the course if found
        res.json(course);  
      } else {
// Log a warning if course is not found
        logger.warn(`Course with ID: ${id} not found`);  
// Return 404 if the course is not found
        res.status(404).send('Course not found');  
      }
    } catch (err) {
// Log any errors during the fetch
      logger.error(`Error fetching course with ID: ${id}`, err);  
// Return 400 for invalid course ID format
      res.status(400).send('Invalid course ID format');  
    }
  });

// POST route to create a new course
app.post('/courses', async (req, res) => {
  // Destructure the course data from the request body
    const {  title, location, price, image, availableInventory, rating } = req.body;  
  
    // Validate that required fields are provided
    if (!title || !rating) {
// Log warning if required fields are missing
      logger.warn('Course title or rating not provided');  
// Return 400 with error message
      return res.status(400).send('Course name and rating are required');  
    }
  
    try {
      // Create the new course object
      const newCourse = {  title, location, price, image, availableInventory, rating };  
  
      // Insert the new course into the MongoDB collection
      const result = await db.collection(collectionName).insertOne(newCourse); 
       // Log success message
      logger.info('New course created'); 
  
      // Respond with the created course data
      res.status(201).json(result.ops[0]); 
    } catch (err) {
// Log any errors
      logger.error('Error saving course', err);  
// Return 500 if there is an error saving the course
      res.status(500).send('Error saving course');  
    }
  });
  
// PUT route to update an existing course by its ID
app.put('/courses/:id', async (req, res) => {
  // Extract the course ID from the URL parameters
    const { id } = req.params;  
    // Extract the updated course data from the body
    const { title, location, price, image, availableInventory, rating } = req.body;  
  
    // Validate that required fields are provided for the update
    if (!title || !rating) {
// Log warning if required fields are missing
      logger.warn('Course name or rating not provided for update');  
// Return 400 with error message
      return res.status(400).send('Course name and rating are required');  
    }
  
    try {
// Convert string ID to MongoDB ObjectId
      const objectId = new ObjectId(id);  
// Log the ID of the course being updated
      logger.info(`Updating course with ID: ${id}`);  
  
      // Update the course with the new data
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
// Log success message if the course is updated
        logger.info(`Course with ID: ${id} updated successfully`);  
// Send success response
        res.send('Course updated successfully');  
      } else {
// Log warning if course was not found for update
        logger.warn(`Course with ID: ${id} not found for update`);  
// Return 404 if course is not found
        res.status(404).send('Course not found');  
      }
    } catch (err) {
// Log any errors during the update
      logger.error(`Error updating course with ID: ${id}`, err);  
// Return 500 if there is an error updating the course
      res.status(500).send('Error updating course');  
    }
  });
  
// DELETE route to remove a course by its ID
app.delete('/courses/:id', async (req, res) => {
  // Extract the course ID from the URL parameters
    const { id } = req.params;  
  
    try {
// Convert string ID to MongoDB ObjectId
      const objectId = new ObjectId(id);  
// Log the ID of the course being deleted
      logger.info(`Deleting course with ID: ${id}`);  
  
      // Delete the course with the specified ID
      const result = await db.collection(collectionName).deleteOne({ _id: objectId });
  
      if (result.deletedCount > 0) {
// Log success if the course is deleted
        logger.info(`Course with ID: ${id} deleted successfully`);  
// Send success response
        res.send('Course deleted successfully');  
      } else {
// Log warning if course was not found for deletion
        logger.warn(`Course with ID: ${id} not found for deletion`);  
// Return 404 if course is not found
        res.status(404).send('Course not found');  
      }
    } catch (err) {
// Log any errors during the deletion
      logger.error(`Error deleting course with ID: ${id}`, err);  
// Return 500 if there is an error deleting the course
      res.status(500).send('Error deleting course');  
    }
  });

// Start the server on the specified port and log that the server is running
app.listen(port, () => {
  logger.info(`Server running on http://localhost:${port}`);
});
