const express=require("express")
const cors=require("cors")
const {open}=require("sqlite")
const sqlite3=require("sqlite3")
const path=require("path")
const { error } = require("console")

const app=express()


app.use(express.json())
app.use(cors())

const dbpath=path.join(__dirname,"contacts.db")

let db=null

const IntializeServerandDB=async()=>{
    try{
        db= await open({
            filename:dbpath,
            driver:sqlite3.Database,
        });
        app.listen(5000,()=>{
            console.log("server running at port 5000")
        });
        await db.run("CREATE TABLE IF NOT EXISTS contacts( id INTEGER PRIMARY KEY, name TEXT, email TEXT, phone TEXT)");
    }catch(e){
        console.log(`DB error:${e}`)
        process.exit(1)
    }
};

IntializeServerandDB()



app.get("/",(req,res)=>{
    res.send("sample")
})


const validateContactData = (req, res, next) => {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'All fields (name, email, phone) are required.' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit phone number.' });
    }

    next();
};



app.post("/contacts",validateContactData, async (req,res)=>{
    const userDetails=req.body 
    const {name,email,phone}=userDetails

    if (!name || !email || !phone){
        res.status(401)
        res.send({error:"Missing required fields: name, email and phone"})
        return
    }

    const addContactQuery=`
    INSERT INTO contacts(name,email,phone)
    VALUES('${name}','${email}','${phone}')
    `
    try{
        const dbResponse=  await db.run(addContactQuery,(err)=>{if (err){console.log(err)}})
        const contactId=dbResponse.lastID
        res.status(201)
        res.send({
            id:contactId,
            name,
            email,
            phone
        })}
    catch(e){
        res.status(500)
        res.send({error:e.message})
    }
})


app.get("/contacts",async(req,res)=>{
    const { page, limit } = req.query
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
        res.status(400).send({ error: "Invalid page or limit number. Both must be positive integers." })
        return
    }

    const offset = (pageNum - 1) * limitNum

    const dbQuery = `SELECT * FROM contacts ORDER BY id LIMIT ${limitNum} OFFSET ${offset}`

    try{
        const dbResponseforGet= await db.all(dbQuery)
        res.send(dbResponseforGet)
    }
    catch(e){
        res.status(500)
        res.send({error:e.message})
    }
})


app.delete("/contacts/:contactId",async(req,res)=>{
    const {contactId}=req.params
    try{
        const deleteQuery=`DELETE FROM contacts WHERE id=${contactId}`;
        await db.run(deleteQuery)
    res.send("deleted successfully")}
    catch(e){
        res.status(500)
        res.send({error:e.message})
    }
})