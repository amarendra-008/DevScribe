import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import type { UpdateDocumentRequest } from '../types';

const router = Router();

// GET /api/documents - List all documents for user
router.get('/', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'User ID required' });
    return;
  }

  const { doc_type, repository_id } = req.query;

  try {
    let query = supabase
      .from('generated_documents')
      .select(`
        *,
        connected_repositories (
          repo_name,
          repo_full_name
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (doc_type) {
      query = query.eq('doc_type', doc_type);
    }

    if (repository_id) {
      query = query.eq('repository_id', repository_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ documents: data });
  } catch (err) {
    console.error('Failed to fetch documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/:id - Get single document
router.get('/:id', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'User ID required' });
    return;
  }

  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('generated_documents')
      .select(`
        *,
        connected_repositories (
          repo_name,
          repo_full_name,
          repo_url
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json({ document: data });
  } catch (err) {
    console.error('Failed to fetch document:', err);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// PUT /api/documents/:id - Update document
router.put('/:id', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'User ID required' });
    return;
  }

  const { id } = req.params;
  const body = req.body as UpdateDocumentRequest;

  if (!body.title && !body.content) {
    res.status(400).json({ error: 'Nothing to update' });
    return;
  }

  try {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title) updates.title = body.title;
    if (body.content) updates.content = body.content;

    const { data, error } = await supabase
      .from('generated_documents')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json({ document: data });
  } catch (err) {
    console.error('Failed to update document:', err);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE /api/documents/:id - Delete document
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'User ID required' });
    return;
  }

  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('generated_documents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('Failed to delete document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
