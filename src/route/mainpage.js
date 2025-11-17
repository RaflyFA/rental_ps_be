import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Halo Tot! Ini halaman utama dYs?');
});

router.get('/about', (req, res) => {
  res.send('Ini halaman About (pakai type: module).');
}); 

export default router;
