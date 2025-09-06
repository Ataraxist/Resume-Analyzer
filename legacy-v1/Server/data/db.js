import { createClient } from '@supabase/supabase-js';
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();




// ------------ << MONGO DATABASE for RESUMES>> --------------

export const connectDB = () => {
  mongoose
    .connect(process.env.MONGODB_URI, {})
    .then(() => console.log("🏪 Connected to Mongo Resume Database."))
    .catch((error) => {
      console.error("❌🏪 Unable to connect to Mongo Resume Database: ", error.message);
      process.exit(1);
    });
};

// SUPABASE STUFF HERE AFTER dotenv imports
const pool = createClient(process.env.SUPABASE_URI, process.env.SUPABASE_KEY)

export const query = async (text) =>{
  console.log('executed query', text)
  try{
const { data, error } = await pool.from("occupation_data").select("title, onetsoc_code")
if (error){
  throw error;
}  
return data
}catch(error){
    console.error(error.message)
  }
}




// const supabase = createClient(process.env.SUPABASE_URI, process.env.SUPABASE_KEY);

// const query = async () => {
//   console.log('⚒️ Executing query to fetch job listings');

//   try {
//     // Query the 'occupation_data' table for 'title' and 'onetsoc_code'
//     const { data, error } = await supabase
//       .from('occupation_data')  // Ensure the table name is correct
//       .select('title, onetsoc_code');  // Ensure these columns exist in the table

//     if (error) {
//       throw error;
//     }

//     console.log('✅ Query Success:', data);
//     return data;
//   } catch (error) {
//     console.error('❌ Error:', error.message);
//     return null;
//   }
// };

// export default query;
