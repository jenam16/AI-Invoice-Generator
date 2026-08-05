import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from "@clerk/express";
import {connectDB} from './config/db.js'

const app = express();
const PORT = process.env.PORT || 3000;


// middlewares
app.use(cors());
app.use(clerkMiddleware());
app.use(express.json({limit:"20mb"}));
app.use(express.urlencoded({limit:"20mb",extended:true}));


// db
connectDB();

app.get('/',(req,res)=>{
    res.send("Api working")
});

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})