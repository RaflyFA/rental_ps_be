import express from 'express';
import mainRouter from './route/mainpage.js'
console.log("OJAN ANAK ILANG");
console.log("JOKOWI PAHLAWAN NASIONAL");
const app = express();
const port = 3000


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/',  mainRouter);
console.log('test');
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})