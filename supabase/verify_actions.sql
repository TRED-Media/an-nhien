-- Run after the market_economy migration. All fixtures and earned points roll back.
begin;
insert into auth.users(id,aud,role,email,raw_user_meta_data) values
('00000000-0000-4000-8000-000000000032','authenticated','authenticated','v32-qa@example.invalid','{"display_name":"QA Actions"}');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000032',true);
set local role authenticated;
select public.game_economy('character','{"gender":"male","career":"photo"}');
select public.game_economy('awaken');
do $$ declare event uuid:=gen_random_uuid(); result jsonb;begin
 result:=public.record_activity('chant',event);
 if (result->>'xp')::int<>1 then raise exception 'First tap must earn 1 XP';end if;
 result:=public.record_activity('chant',event);
 if (result->>'xp')::int<>1 or not (result->>'duplicate')::boolean then raise exception 'Retry awarded twice';end if;
 for i in 1..10 loop perform public.record_activity('beads',gen_random_uuid());end loop;
 if (select xp from public.profiles where id=auth.uid())<>11 then raise exception 'Rapid gestures were limited or miscounted';end if;
 perform public.record_activity('meal',gen_random_uuid());
 perform public.record_activity('prostrate',gen_random_uuid());
 perform public.record_activity('sermon',gen_random_uuid());
 if (select xp from public.profiles where id=auth.uid())<>14 then raise exception 'Indoor rewards failed';end if;
 begin update public.profiles set xp=99999 where id=auth.uid();raise exception 'Direct XP update allowed';exception when insufficient_privilege then null;end;
 begin perform public.record_activity('unknown',gen_random_uuid());raise exception 'Unknown activity allowed';exception when others then if sqlerrm<>'Hoạt động không hợp lệ.' then raise;end if;end;
end;$$;
select 'PASS: +1 per gesture, unlimited repeats, idempotent retry, indoor rewards, protected XP' as checks;
rollback;
