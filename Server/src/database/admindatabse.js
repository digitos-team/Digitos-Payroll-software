import mongoose, { mongo } from "mongoose";
let PayrollDB = "mongodb://localhost:27017/admindatabase";

async function connectToDatabase() {
  try {
    let connection = await mongoose.connect(PayrollDB);
    console.log("DataBase Connected", connection.connection.name);
  } catch (error) {
    console.log(error);
  }
}
export { connectToDatabase };
