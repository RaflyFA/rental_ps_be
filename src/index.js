import express from 'express';
import mainRouter from './route/mainpage.js'

const app = express();
const port = 3000


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/',  mainRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})