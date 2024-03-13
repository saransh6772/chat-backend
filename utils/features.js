import mongoose from "mongoose"

const connectDB = (uri) => {
    mongoose.connect(uri, { dbName: 'Chat_App' }).then((data) => {
        console.log(`Connected to the database ${data.connection.host}`)
    }).catch((err) => {
        throw err
    })
}

export { connectDB }