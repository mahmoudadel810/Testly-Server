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
  
  }
};
export default connectionDB;
// mongoose.set("strictQuery", true);  