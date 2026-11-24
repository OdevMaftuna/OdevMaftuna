-- 0012: phrasal verbs bo'limi (practice_topics.kind = 'phrasal').
alter table public.practice_topics drop constraint practice_topics_kind_check;
alter table public.practice_topics add constraint practice_topics_kind_check check (kind in ('grammar', 'vocab', 'phrasal'));
