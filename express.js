const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); // Import ObjectId for ID handling

// Initialize express app
const app = express();
const port = 3000;

// Middleware to parse incoming JSON data
app.use(express.json());

// MongoDB connection URI (replace with your connection string)
const uri = 'mongodb+srv://mg1415:CW01@cluster0.eyfy3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // MongoDB URI (adjust if necessary)
const dbName = 'courses'; // Database name 
const collectionName = 'coursecollection'; // Collection name
let db;

// Connect to MongoDB and initialize the database connection
MongoClient.connect(uri)
  .then((client) => {
    console.log('Connected to MongoDB');
    db = client.db(dbName); // Initialize the database
  })
  .catch((err) => console.log('Error connecting to MongoDB: ', err));

// Routes

// 1. GET route to retrieve all courses from the "coursecollection" collection
app.get('/courses', async (req, res) => {
  try {
    const courses = await db.collection(collectionName).find().toArray(); // Fetch all courses
    res.json(courses);
  } catch (err) {
    res.status(500).send('Error fetching courses');
  }
});

// 2. GET route to retrieve a specific course by its ID
app.get('/courses/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Convert the ID string to ObjectId
    const objectId = new ObjectId(id);

    // Fetch the course by its ObjectId
    const course = await db.collection(collectionName).findOne({ _id: objectId });

    if (course) {
      res.json(course); // Send course data as a response
    } else {
      res.status(404).send('Course not found'); // Course not found
    }
  } catch (err) {
    // Handle invalid ObjectId format or other errors
    res.status(400).send('Invalid course ID format');
  }
});

// 3. GET route to retrieve courses with filtering options (e.g., by courseName or duration)
app.get('/courses/filter', async (req, res) => {
  const { courseName, duration } = req.query;
  
  const filter = {};
  if (courseName) {
    filter.courseName = { $regex: courseName, $options: 'i' }; // Case-insensitive search for courseName
  }
  if (duration) {
    filter.duration = parseInt(duration, 10); // Convert duration to integer for comparison
  }

  try {
    const courses = await db.collection(collectionName).find(filter).toArray(); // Apply filter and fetch courses
    res.json(courses);
  } catch (err) {
    res.status(500).send('Error fetching courses with filters');
  }
});

// 4. POST route to create a new course in the "coursecollection" collection
app.post('/courses', async (req, res) => {
  const { courseName, description, duration } = req.body;

  // Validate that courseName and duration are provided
  if (!courseName || !duration) {
    return res.status(400).send('Course name and duration are required');
  }

  try {
    // Create new course object
    const newCourse = { courseName, description, duration };
    const result = await db.collection(collectionName).insertOne(newCourse); // Insert the new course into the collection
    res.status(201).json(result.ops[0]); // Respond with the created course
  } catch (err) {
    res.status(500).send('Error saving course');
  }
});

// 5. PUT route to update a course in the "coursecollection" collection
app.put('/courses/:id', async (req, res) => {
  const { id } = req.params;
  const { courseName, description, duration } = req.body;

  // Validate that courseName and duration are provided
  if (!courseName || !duration) {
    return res.status(400).send('Course name and duration are required');
  }

  try {
    const objectId = new ObjectId(id); // Convert string ID to ObjectId

    // Update course information
    const result = await db.collection(collectionName).updateOne(
      { _id: objectId },
      {
        $set: {
          courseName,
          description,
          duration,
        },
      }
    );

    if (result.modifiedCount > 0) {
      res.send('Course updated successfully');
    } else {
      res.status(404).send('Course not found');
    }
  } catch (err) {
    res.status(500).send('Error updating course');
  }
});

// 6. PATCH route to update partial data of a course
app.patch('/courses/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const objectId = new ObjectId(id); // Convert string ID to ObjectId

    // Update only the fields provided in the request body
    const result = await db.collection(collectionName).updateOne(
      { _id: objectId },
      {
        $set: updateData, // Partial update
      }
    );

    if (result.modifiedCount > 0) {
      res.send('Course updated successfully');
    } else {
      res.status(404).send('Course not found');
    }
  } catch (err) {
    res.status(500).send('Error updating course');
  }
});

// 7. DELETE route to remove a course from the "coursecollection" collection
app.delete('/courses/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const objectId = new ObjectId(id); // Convert string ID to ObjectId

    // Delete the course
    const result = await db.collection(collectionName).deleteOne({ _id: objectId });

    if (result.deletedCount > 0) {
      res.send('Course deleted successfully');
    } else {
      res.status(404).send('Course not found');
    }
  } catch (err) {
    res.status(500).send('Error deleting course');
  }
});


// Start the Express server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
