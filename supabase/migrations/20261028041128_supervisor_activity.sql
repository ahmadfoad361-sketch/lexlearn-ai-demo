-- Known Lusail faculty aliases, read-time only. Existing course/year/country gates remain.
create or replace function private.academic_faculty_key(value text,institution text)
returns text language sql immutable security invoker set search_path='' as $$
 select case when private.academic_university_key(institution)='lusail university'
 and private.academic_text(value) in ('law','faculty of law','college of law','كلية القانون','القانون','كلية الحقوق','الحقوق')
 then 'كلية القانون' else private.academic_text(value) end;
$$;

create table private.site_activity_settings (
 id boolean primary key default true check(id), started_at timestamptz not null default now(), cleaned_at timestamptz not null default now()
);
insert into private.site_activity_settings(id) values(true);
create table private.site_activity (
 event_id uuid primary key, visitor_id uuid not null, session_id uuid not null,
 user_id uuid references public.profiles(id) on delete set null,
 page text not null check(page ~ '^[a-z0-9-]+\.html$' and length(page)<=64),
 created_at timestamptz not null default now()
);
create index site_activity_time_idx on private.site_activity(created_at);
create index site_activity_user_time_idx on private.site_activity(user_id,created_at);
create table private.site_activity_limits (
 key text not null, bucket timestamptz not null, hits integer not null, primary key(key,bucket)
);
alter table private.site_activity enable row level security;
alter table private.site_activity_settings enable row level security;
alter table private.site_activity_limits enable row level security;
revoke all on private.site_activity,private.site_activity_settings,private.site_activity_limits from public,anon,authenticated;
grant usage on schema private to service_role;
grant select,insert,update,delete on private.site_activity,private.site_activity_settings,private.site_activity_limits to service_role;
-- Only the service role can write or read. Edge Functions enforce input and staff authorization.
create or replace function public.lex_record_site_activity(p_event uuid,p_visitor uuid,p_session uuid,p_user uuid,p_page text,p_network text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare count_hits integer; minute_bucket timestamptz:=date_trunc('minute',now());
begin
 if p_network !~ '^[a-f0-9]{64}$' then raise exception 'invalid_network'; end if;
 insert into private.site_activity_limits(key,bucket,hits) values('network:'||p_network,minute_bucket,1)
 on conflict(key,bucket) do update set hits=private.site_activity_limits.hits+1 returning hits into count_hits;
 if count_hits>240 then return false; end if;
 insert into private.site_activity_limits(key,bucket,hits) values('visitor:'||p_visitor::text,minute_bucket,1)
 on conflict(key,bucket) do update set hits=private.site_activity_limits.hits+1 returning hits into count_hits;
 if count_hits>30 then return false; end if;
 insert into private.site_activity(event_id,visitor_id,session_id,user_id,page)
 values(p_event,p_visitor,p_session,p_user,p_page) on conflict(event_id) do nothing;
 update private.site_activity_settings set cleaned_at=now() where id and cleaned_at<now()-interval '1 hour';
 if found then
  delete from private.site_activity where created_at<now()-interval '90 days';
  delete from private.site_activity_limits where bucket<now()-interval '2 hours';
 end if;
 return true;
end $$;
revoke all on function public.lex_record_site_activity(uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.lex_record_site_activity(uuid,uuid,uuid,uuid,text,text) to service_role;

create or replace function public.lex_site_activity_report(p_days integer default 7,p_page integer default 0)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare since_at timestamptz; started timestamptz; result jsonb;
begin
 if p_days not in (1,7,30,90) or p_page<0 or p_page>100000 then raise exception 'invalid_period';end if;
 select started_at into started from private.site_activity_settings where id;
 since_at:=greatest(started, (date_trunc('day',now() at time zone 'UTC')-make_interval(days=>p_days-1)) at time zone 'UTC');
 with events as materialized (select * from private.site_activity where created_at>=since_at),
 account_events as (select user_id,count(distinct session_id) visits,count(*) views,max(created_at) last_seen
   from events where user_id is not null group by user_id),
 accounts as (select p.id,p.display_name,p.username,p.role,p.active,p.account_status,p.created_at,
   coalesce(e.visits,0) visits,coalesce(e.views,0) views,e.last_seen
   from public.profiles p left join account_events e on e.user_id=p.id where p.role in ('student','instructor'))
 select jsonb_build_object(
  'started_at',started,'since',since_at,'until',now(),'days',p_days,'page',p_page,
  'views',(select count(*) from events),'visitors',(select count(distinct visitor_id) from events),
  'visits',(select count(distinct (visitor_id,session_id)) from events),
  'returning_visitors',(select count(*) from (select visitor_id from events group by visitor_id having count(distinct session_id)>1) r),
  'registered_students',(select count(*) from accounts where role='student'),
  'active_students',(select count(*) from accounts where role='student' and active),
  'registered_instructors',(select count(*) from accounts where role='instructor'),
  'new_students',(select count(*) from accounts where role='student' and created_at>=since_at),
  'active_accounts',(select count(*) from accounts where visits>0),'account_total',(select count(*) from accounts),
  'daily',coalesce((select jsonb_agg(jsonb_build_object('day',d.day::date,'views',d.views,'visits',d.visits,'visitors',d.visitors) order by d.day)
   from (select day,count(e.event_id) views,count(distinct (e.visitor_id,e.session_id)) filter(where e.event_id is not null) visits,count(distinct e.visitor_id) visitors
    from generate_series(date_trunc('day',since_at at time zone 'UTC'),date_trunc('day',now() at time zone 'UTC'),interval '1 day') day
    left join events e on (e.created_at at time zone 'UTC')::date=day::date group by day) d),'[]'::jsonb),
  'pages',coalesce((select jsonb_agg(to_jsonb(x)) from (select page,count(*) views,count(distinct visitor_id) visitors from events group by page order by count(*) desc,page limit 12)x),'[]'::jsonb),
  'accounts',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from accounts order by last_seen desc nulls last,created_at desc,id limit 25 offset p_page*25)x),'[]'::jsonb)
 ) into result;
 return result;
end $$;
revoke all on function public.lex_site_activity_report(integer,integer) from public,anon,authenticated;
grant execute on function public.lex_site_activity_report(integer,integer) to service_role;
