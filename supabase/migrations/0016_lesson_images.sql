-- 0016: Multilevel darslari — kitob sahifasidan qirqilgan mashq rasmlari ham lesson-audio bucketida
-- (yopiq; o'quvchiga vaqtinchalik imzolangan havola orqali beriladi, audiolar bilan bir xil tartib).
update storage.buckets
set allowed_mime_types = array['audio/mpeg', 'image/jpeg']
where id = 'lesson-audio';
