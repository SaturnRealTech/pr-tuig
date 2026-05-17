import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MongoDB URI to .env');
}

const uri = process.env.MONGODB_URI;

const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 10000,
};

let clientPromise;

if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect()
        .then((c) => { console.log('✅ MongoDB Connected'); return c; })
        .catch((err) => { console.error('❌ MongoDB Connection Error:', err.message); throw err; });
}

clientPromise = global._mongoClientPromise;

export default clientPromise;



// import { MongoClient } from "mongodb";

// if (!process.env.MONGODB_URI) {
//     throw new Error("Please add your MongoDB URI to .env");
// }

// const uri = process.env.MONGODB_URI;

// const options = {
//     tls: true,
//     serverSelectionTimeoutMS: 60000,
//     socketTimeoutMS: 60000,
//     connectTimeoutMS: 60000,
//     maxPoolSize: 20,
//     minPoolSize: 5,
//     family: 4,
// };

// let client;
// let clientPromise;

// if (!global._mongoClientPromise) {
//     client = new MongoClient(uri, options);

//     global._mongoClientPromise = client.connect()
//         .then((client) => {
//             console.log("✅ MongoDB Connected");
//             return client;
//         })
//         .catch((err) => {
//             console.error("❌ MongoDB Connection Error:", err);
//             throw err;
//         });
// }

// clientPromise = global._mongoClientPromise;

// export default clientPromise;






// import { MongoClient } from 'mongodb';

// if (!process.env.MONGODB_URI) {
//     throw new Error('Please add your MongoDB URI to .env');
// }

// const uri = process.env.MONGODB_URI;
// const options = {
//     tls: true,
//     // tlsAllowInvalidCertificates: true, 
//     // tlsAllowInvalidHostnames: true,
//     serverSelectionTimeoutMS: 60000,

//     socketTimeoutMS: 60000,

//     connectTimeoutMS: 60000,

//     maxPoolSize: 20,

//     minPoolSize: 5,

//     family: 4,
// };

// let client;
// let clientPromise;

// if (process.env.NODE_ENV === 'development') {
//     // In development mode, use a global variable to preserve the connection
//     // across hot reloads
//     if (!global._mongoClientPromise) {
//         client = new MongoClient(uri, options);
//         global._mongoClientPromise = client.connect().catch(err => {
//             console.error('MongoDB connection error:', err.message);
//             throw err;
//         });
//     }
//     clientPromise = global._mongoClientPromise;
// } else {
//     // In production mode, create a new client for each connection
//     client = new MongoClient(uri, options);
//     clientPromise = client.connect();
// }

// export default clientPromise;
