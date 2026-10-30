-- Run in SQL Editor. Everything is rolled back, including the two fixture users.
begin;
insert into auth.users(id,aud,role,email,raw_user_meta_data) values
('00000000-0000-4000-8000-0000000000a1','authenticated','authenticated','qa-a@example.invalid','{"display_name":"QA A"}'),
('00000000-0000-4000-8000-0000000000b1','authenticated','authenticated','qa-b@example.invalid','{"display_name":"QA B"}');
insert into public.activity_attempts(id,user_id,activity_id,started_at) values
('00000000-0000-4000-8000-0000000000c1','00000000-0000-4000-8000-0000000000a1','fish',now()-interval '60 seconds');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.profiles)<>1 then raise exception 'RLS profile isolation failed';end if;
 if exists(select 1 from public.profiles where id='00000000-0000-4000-8000-0000000000b1') then raise exception 'Cross-user profile visible';end if;
 begin update public.profiles set xp=999999 where id=auth.uid();raise exception 'XP write was allowed';exception when insufficient_privilege then null;end;
 begin perform public.admin_activity('fish',99,false);raise exception 'Player received admin access';exception when others then if sqlerrm<>'Chỉ chủ chùa được cấu hình.' then raise;end if;end;
 begin insert into public.wishes(user_id,body) values('00000000-0000-4000-8000-0000000000b1','test');raise exception 'Cross-user wish allowed';exception when insufficient_privilege then null;end;
end;$$;
select public.finish_activity('00000000-0000-4000-8000-0000000000c1') as reward;
do $$ begin
 if (select xp from public.profiles where id=auth.uid())<>1 then raise exception 'Wrong XP';end if;
 begin perform public.finish_activity('00000000-0000-4000-8000-0000000000c1');raise exception 'Duplicate reward allowed';exception when others then if sqlerrm<>'Phần thưởng đã được nhận.' then raise;end if;end;
end;$$;
select 'PASS: RLS isolation, no XP writes, no admin access, private wishes, reward +1, no duplicate reward' as checks;
rollback;
