import mongoose, { mongo } from "mongoose";
async function connectToDatabase() {
  try {
    let PayrollDB = process.env.MONGO_URI;
    let connection = await mongoose.connect(PayrollDB);
    console.log("DataBase Connected", connection.connection.name);
  } catch (error) {
    console.log(error);
  }
}
export { connectToDatabase };
