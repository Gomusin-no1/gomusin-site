-- =========================================================
-- 03. 이미지 저장소 (2-7 이미지 업로드)
-- "uploads" 버킷: 누구나 사진을 볼 수 있고(공개 URL),
-- 로그인한 사람만 "내 폴더(내 user id)" 안에 올리고 지울 수 있어요.
-- 파일 경로 규칙: uploads/{내 user id}/{시간}-{파일이름}
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 5242880,                       -- 5MB 제한
        array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])  -- 이미지만
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "uploads 공개 읽기" on storage.objects;
create policy "uploads 공개 읽기" on storage.objects for select
  using (bucket_id = 'uploads');

drop policy if exists "uploads 내 폴더에 올리기" on storage.objects;
create policy "uploads 내 폴더에 올리기" on storage.objects for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "uploads 내 파일 지우기" on storage.objects;
create policy "uploads 내 파일 지우기" on storage.objects for delete to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
