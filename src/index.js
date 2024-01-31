require('dotenv').config();

const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())

const port = process.env.port

//Model
const User = mongoose.model('User', {
    nome: String,
    email: String,
    telefone: String,
    cpf: String,
    endereco: String,
    senha: String
})

//List users
app.get("/", async (req, res) => {
    return res.json("hello world");
})

app.get("/users", async (req, res) => {
    const users = await User.find()
    return res.send(users)
})


//Save new user
app.post("/save_user", async (req, res) => {
    try{
        const { cpf, senha } = req.body
        const findUser = await User.findOne({ cpf })

        if(findUser){
            return res.status(400).json({error: "This user already exists!"});
        }

        const hashedPassword = await bcrypt.hash(senha, 10)

        const user = new User({
            nome: req.body.nome,
            email: req.body.email,
            telefone: req.body.telefone,
            cpf: req.body.cpf,
            endereco: req.body.endereco,
            senha: hashedPassword
        })
    
        await user.save()
        res.status(201).json({ message: "User registered successfully!" })
    }catch(error){
        console.error('Error saving user:', error)
        res.status(500).json({error: 'Internal server error'})
    }
})

//User login
app.post("/user_login", async (req,res) => {
    try{
        const { email, senha } = req.body

        const user = await User.findOne({ email })

        if(!user){
            return res.status(401).json({ error: 'Invalid email' })
        }

        const compareSenha = await bcrypt.compare(senha, user.senha)

        if(!compareSenha){
            return res.status(401).json({ error: 'Invalid password' })
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' })

        res.json({ token })
        
    }catch(error){
        console.error('Error during login: ', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

//Update user
app.put("/update_user_:id", async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, {
        nome: req.body.nome,
        email: req.body.email,
        telefone: req.body.telefone,
        cpf: req.body.cpf,
        endereco: req.body.endereco,
        senha: req.body.senha
    }, {
        new: true
    })

    return res.send(user)
})

app.listen(port, () => {
    mongoose.connect(process.env.mongodb_connection_user)
    console.log("API running")
})