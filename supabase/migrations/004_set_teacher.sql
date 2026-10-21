-- Run AFTER creating both users in Authentication → Users
-- (teacher@ielts.local and student@ielts.local).
update public.profiles set role = 'teacher', display_name = 'Teacher' where username = 'teacher';
update public.profiles set role = 'student', display_name = 'Student' where username = 'student';

-- Check: should return 2 rows with the right roles.
select username, display_name, role from public.profiles order by role;
