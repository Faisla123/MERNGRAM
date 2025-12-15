import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.routes.js";
import postRoute from "./routes/post.route.js";
import messageRoute from "./routes/message.route.js";

dotenv.config({});

const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (res, req) => {
  return res.status(200).json({
    message: "Turned ON",
    success: true,
  });
});
//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

//Here our API will come:
app.use("/api/v2/user", userRoute);
app.use("/api/v2/post", postRoute);
app.use("api/v2/message", messageRoute);

app.listen(PORT, () => {
  connectDB();
  console.log(`Welcome to the server ${PORT}`);
});
