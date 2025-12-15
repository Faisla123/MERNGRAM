import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({});
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.APIKEY_CLOUDINARY,
  api_secret: process.env.SECRET_APIKEY_CLOUDINARY,
});
export default cloudinary;
