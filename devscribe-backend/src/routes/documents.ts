import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth, asyncHandler } from '../lib/middleware';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { doc_type } = req.query;

  let query = supabase
    .from('generated_documents')
    .select('*, connected_repositories(repo_name, repo_full_name)')
    .eq('user_id', req.userId)
    .order('updated_at', { ascending: false });

  if (doc_type) query = query.eq('doc_type', doc_type);

  const { data, error } = await query;
  if (error) throw error;
  res.json({ documents: data });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('generated_documents')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId);

  if (error) throw error;
  res.status(204).send();
}));

export default router;
