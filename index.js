import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

const app =express();
app.set("view engine" , "ejs");

app.use(express.static('public'));
                                                                                                                                                                                   


const port = 3000;
app.get("/" , (req,res)=>{
    res.render("home");
})

app.get("/instructor" , (req,res)=>{
    res.render("instructor");
})

app.get("/performance" , (req,res)=>{
    res.render("performance");
})

app.listen(port , ()=>{
    console.log(`listening on port ${port}`)
})





