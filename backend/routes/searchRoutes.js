import express from 'express';
import { searchSustainability } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', searchSustainability);

export default router;
