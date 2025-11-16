import express from 'express';
import {
  getMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
} from '../controller/membership/membership.controller.js';

const router = express.Router();

router.get('/', getMemberships);
router.get('/:id', getMembershipById);
router.post('/', createMembership);
router.put('/:id', updateMembership);
router.delete('/:id', deleteMembership);

export default router;
