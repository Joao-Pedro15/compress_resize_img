const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const fsPromises = fs.promises
const sharp = require('sharp')
const compress_images = require('compress-images')
const app = express()

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'uploads/')
    },
    filename: (req, file, cb)=>{
        cb(null, file.originalname)
    },
})


const upload = multer({storage})

app.get('/', (req, res)=>{
    res.render('index')
})


app.post('/upload', upload.single('file'), resize, (req,res)=>{
    res.send('arquivo recebido!')
})

app.get('/get', async (req, res)=>{
    let file = await fsPromises.readdir('./uploads')
    if(file.length == 0) return res.send('pasta vazia')
    const jpg = path.join(__dirname, 'uploads/', file[0])
    return res.sendFile(jpg)
    
})

async function resize(){
    let file = await fsPromises.readdir('./uploads')
    if(file.length == 0) return res.send('pasta vazia')
    sharp(`./uploads/${file[0]}`).resize({width: 300}).toFile(`./resizeDir/${file[0]}`, (err)=>{
        if(err){
            console.log(err)
        }else{
            console.log('imagem redimensionada!')
            compress()
        }
    })
}

async function compress(){
    let file = await fsPromises.readdir('./resizeDir')
    if(file.length == 0) return res.send('pasta vazia')
    compress_images(`./resizeDir/${file[0]}`, './compressDir/', { compress_force: false, statistic: true,   autoupdate: true }, false,
        { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } },
        { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } },
        { svg: { engine: "svgo", command: "--multipass" } },
        { gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
        function (error, completed, statistic) {
            console.log("-------------");
            console.log(error);
            console.log(completed);
            console.log(statistic);
            console.log("-------------");        
        })
}

app.listen(3000, ()=>{
    console.log('Server running!')
})