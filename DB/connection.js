import mongoose from "mongoose";
import logger from '../utils/logger.js';

const connectionDB = async () =>
{
  try
  {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("DB Connected .......!!");
  } catch (err)
  {
    logger.error("DB Connection Failed !!", { error: err.message });
    // Consider exiting the process or handling the error appropriately
    // process.exit(1);
  }
};
export default connectionDB;
// mongoose.set("strictQuery", true);  