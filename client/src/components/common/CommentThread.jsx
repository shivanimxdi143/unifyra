import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Trash2, CornerDownRight, Loader2 } from 'lucide-react';
import { getComments, addComment, deleteComment } from '../../services/api';

const ROLE_BADGE = {
  'Brand Manager': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  'Reviewer':      'bg-amber-50 text-amber-800 border border-amber-200',
  'Employee':      'bg-emerald-50 text-emerald-800 border border-emerald-200',
};

function roleBadge(role) {
  return ROLE_BADGE[role] || 'bg-slate-50 text-slate-700 border border-slate-200';
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CommentThread({ submissionId, currentRole, showToast }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { _id, authorId }
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchComments = useCallback(async () => {
    if (!submissionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getComments(submissionId);
      setComments(res.data || []);
    } catch (err) {
      setError('Failed to load comments.');
    } finally {
      setIsLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const canDelete = (comment) =>
    comment.authorId === currentRole ||
    currentRole === 'Reviewer' ||
    currentRole === 'Brand Manager';

  const handlePost = async () => {
    const text = newText.trim();
    if (!text) return;
    setIsSubmitting(true);
    try {
      await addComment(submissionId, {
        authorId: currentRole,
        authorRole: currentRole,
        text,
      });
      setNewText('');
      await fetchComments();
      window.dispatchEvent(new Event('unifyra-data-updated'));
    } catch {
      showToast?.('Failed to post comment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    const text = replyText.trim();
    if (!text || !replyingTo) return;
    setIsSubmittingReply(true);
    try {
      await addComment(submissionId, {
        authorId: currentRole,
        authorRole: currentRole,
        text,
        parentId: replyingTo._id,
      });
      setReplyText('');
      setReplyingTo(null);
      await fetchComments();
      window.dispatchEvent(new Event('unifyra-data-updated'));
    } catch {
      showToast?.('Failed to post reply.', 'error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDelete = async (commentId) => {
    setDeletingId(commentId);
    try {
      await deleteComment(commentId);
      await fetchComments();
      window.dispatchEvent(new Event('unifyra-data-updated'));
    } catch {
      showToast?.('Failed to delete comment.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const topLevel = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => !!c.parentId);

  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
        Collaboration Comments ({comments.length})
      </h4>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 mb-3">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-7 w-7 border-4 border-indigo-600 border-t-transparent" />
        </div>
      )}

      {/* Comment list */}
      {!isLoading && (
        <div className="space-y-2 mb-3 max-h-56 overflow-y-auto">
          {topLevel.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-3">
              No comments yet. Be the first to add one.
            </p>
          )}

          {topLevel.map((c) => {
            const childReplies = replies.filter((r) => String(r.parentId) === String(c._id));
            return (
              <div key={c._id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5">
                {/* Top-level comment */}
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                    {initials(c.authorId)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="font-semibold text-slate-900">{c.authorId}</span>
                      <span className={`px-1.5 py-0 rounded text-[10px] font-semibold ${roleBadge(c.authorRole)}`}>
                        {c.authorRole}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto">{relativeTime(c.createdAt)}</span>
                    </div>
                    <p className="text-slate-700 leading-snug">{c.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setReplyingTo(replyingTo?._id === c._id ? null : c)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        Reply
                      </button>
                      {canDelete(c) && (
                        <button
                          type="button"
                          disabled={deletingId === c._id}
                          onClick={() => handleDelete(c._id)}
                          className="text-[10px] text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline reply box */}
                {replyingTo?._id === c._id && (
                  <div className="pl-8 space-y-1.5">
                    <p className="text-[10px] text-slate-500 font-medium">
                      Replying to <strong>{c.authorId}</strong>
                    </p>
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full text-xs p-2 rounded-lg border border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isSubmittingReply || !replyText.trim()}
                        onClick={handleReply}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        {isSubmittingReply && <Loader2 className="w-3 h-3 animate-spin" />}
                        Post Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Threaded replies */}
                {childReplies.length > 0 && (
                  <div className="pl-8 space-y-1.5 border-l-2 border-indigo-100 ml-3">
                    {childReplies.map((r) => (
                      <div key={r._id} className="p-2 rounded-lg border border-slate-100 bg-white text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900">{r.authorId}</span>
                          <span className={`px-1.5 py-0 rounded text-[10px] font-semibold ${roleBadge(r.authorRole)}`}>
                            {r.authorRole}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto">{relativeTime(r.createdAt)}</span>
                        </div>
                        <p className="text-slate-700 leading-snug">{r.text}</p>
                        {canDelete(r) && (
                          <button
                            type="button"
                            disabled={deletingId === r._id}
                            onClick={() => handleDelete(r._id)}
                            className="text-[10px] text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 mt-0.5 cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add new top-level comment */}
      <div className="space-y-1.5">
        <textarea
          rows={2}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Add a comment..."
          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
        <div className="flex justify-end">
          <button
            type="button"
            disabled={isSubmitting || !newText.trim()}
            onClick={handlePost}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Post Comment
          </button>
        </div>
      </div>
    </div>
  );
}
