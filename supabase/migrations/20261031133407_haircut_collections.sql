begin;

create table public.haircut_collections(
 id uuid primary key default gen_random_uuid(),customer_id uuid not null references auth.users on delete cascade,
 title text not null check(char_length(btrim(title))between 1 and 100),created_at timestamptz not null default clock_timestamp(),deleted_at timestamptz,
 unique(customer_id,id)
);
create index haircut_collections_owner on public.haircut_collections(customer_id,created_at desc);
alter table public.haircut_collections enable row level security;
revoke all on public.haircut_collections from public,anon,authenticated;
grant select on public.haircut_collections to authenticated;
create policy own_haircut_collections on public.haircut_collections for select to authenticated using(customer_id=(select auth.uid()));
alter table public.customer_haircuts add column collection_id uuid;
insert into public.haircut_collections(id,customer_id,title,created_at,deleted_at)select id,customer_id,title,created_at,deleted_at from public.customer_haircuts;
update public.customer_haircuts set collection_id=id;
alter table public.customer_haircuts alter column collection_id set not null;
alter table public.customer_haircuts add foreign key(customer_id,collection_id)references public.haircut_collections(customer_id,id)on delete cascade;
create index haircut_collection_photos on public.customer_haircuts(collection_id,created_at,id);
drop index public.haircut_saved_inspiration;
create unique index haircut_saved_inspiration on public.customer_haircuts(customer_id,collection_id,hairstyle_id)where hairstyle_id is not null and deleted_at is null;

-- Older clients may still save single pictures. They receive a private one-photo collection.
create function bookmyturn_private.photo_collection()returns trigger language plpgsql security definer set search_path=''as $$begin
 if new.collection_id is null then
  insert into public.haircut_collections(customer_id,title)values(new.customer_id,new.title)returning id into new.collection_id;
 elsif not exists(select 1 from public.haircut_collections where id=new.collection_id and customer_id=new.customer_id and deleted_at is null)then raise exception 'Collection unavailable'using errcode='42501';end if;
 return new;
end;$$;
create trigger photo_collection before insert on public.customer_haircuts for each row execute function bookmyturn_private.photo_collection();

create function bookmyturn_private.customer_collections(p_action text,p_data jsonb default '{}')returns jsonb
language plpgsql security definer set search_path=''as $$
declare u uuid:=auth.uid();entry uuid:=(p_data->>'id')::uuid;photo jsonb;photo_id uuid;style uuid;media text;label text;
begin
 if u is null then raise exception 'Sign in to manage your collections'using errcode='42501';end if;
 if p_action='list'then return coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('photos',
  (select coalesce(jsonb_agg(to_jsonb(h)||jsonb_build_object('image_url',s.image_url)order by h.created_at,h.id),'[]')from public.customer_haircuts h left join public.hairstyles s on s.id=h.hairstyle_id where h.collection_id=c.id and h.deleted_at is null))order by c.created_at desc,c.id)
  from public.haircut_collections c where c.customer_id=u and c.deleted_at is null),'[]');end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,2));
 if p_action='create'then
  entry:=coalesce(entry,gen_random_uuid());
  if exists(select 1 from public.haircut_collections where id=entry)then
   if not exists(select 1 from public.haircut_collections where id=entry and customer_id=u and deleted_at is null)then raise exception 'Collection unavailable'using errcode='42501';end if;
   return jsonb_build_object('id',entry);
  end if;
  label:=btrim(p_data->>'title');if coalesce(char_length(label),0)not between 1 and 100 then raise exception 'Enter a collection name';end if;
  insert into public.haircut_collections(id,customer_id,title)values(entry,u,label);
 else
  if not exists(select 1 from public.haircut_collections where id=entry and customer_id=u and deleted_at is null)then raise exception 'Collection unavailable'using errcode='42501';end if;
  if p_action='rename'then
   label:=btrim(p_data->>'title');if coalesce(char_length(label),0)not between 1 and 100 then raise exception 'Enter a collection name';end if;
   update public.haircut_collections set title=label where id=entry;
  elsif p_action='remove'then
   update public.haircut_collections set deleted_at=clock_timestamp()where id=entry;
   update public.customer_haircuts set deleted_at=coalesce(deleted_at,clock_timestamp())where collection_id=entry;
  elsif p_action='add_photos'then
   if jsonb_typeof(p_data->'photos')is distinct from 'array'or jsonb_array_length(p_data->'photos')not between 1 and 20 then raise exception 'Choose one to twenty photos';end if;
   for photo in select value from jsonb_array_elements(p_data->'photos')loop
    photo_id:=coalesce((photo->>'id')::uuid,gen_random_uuid());style:=(photo->>'hairstyle_id')::uuid;media:=nullif(photo->>'storage_path','');
    if exists(select 1 from public.customer_haircuts where id=photo_id)then
     if not exists(select 1 from public.customer_haircuts where id=photo_id and customer_id=u and collection_id=entry and deleted_at is null and storage_path is not distinct from media and hairstyle_id is not distinct from style)then raise exception 'Photo unavailable'using errcode='42501';end if;continue;
    end if;
    if num_nonnulls(style,media)<>1 then raise exception 'Choose one photo source';end if;
    if style is not null then
     if not exists(select 1 from public.hairstyles where id=style and is_published)then raise exception 'Photo unavailable';end if;
     if exists(select 1 from public.customer_haircuts where collection_id=entry and hairstyle_id=style and deleted_at is null)then continue;end if;
    elsif split_part(media,'/',1)<>u::text or media !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'then raise exception 'Photo does not belong to this account'using errcode='42501';end if;
    if(select count(*)from public.customer_haircuts where collection_id=entry and deleted_at is null)>=20 then raise exception 'A collection can hold twenty photos';end if;
    label:=coalesce(nullif(btrim(photo->>'title'),''),(select h.title from public.hairstyles h where h.id=style),'My haircut');
    insert into public.customer_haircuts(id,customer_id,collection_id,title,hairstyle_id,storage_path)values(photo_id,u,entry,label,style,media);
   end loop;
  else raise exception 'Unknown collection action';end if;
 end if;
 return jsonb_build_object('id',entry);
end;$$;
create function public.customer_collections(p_action text,p_data jsonb default '{}')returns jsonb language sql security invoker set search_path=''as $$select bookmyturn_private.customer_collections(p_action,p_data);$$;

-- Snapshot all selected pictures. Later library edits cannot change a shared reference.
alter table bookmyturn_private.haircut_references add column collection_id uuid references public.haircut_collections on delete set null;
alter table bookmyturn_private.haircut_references add column images jsonb not null default '[]'check(jsonb_typeof(images)='array'and jsonb_array_length(images)<=20);
create index haircut_reference_collection on bookmyturn_private.haircut_references(collection_id);
create index haircut_reference_images on bookmyturn_private.haircut_references using gin(images jsonb_path_ops);
update bookmyturn_private.haircut_references set images=jsonb_build_array(jsonb_build_object('id',id,'title',title,'storage_path',storage_path,'image_url',image_url));
create function bookmyturn_private.collection_snapshot(p_collection uuid)returns jsonb language plpgsql security definer set search_path=''as $$declare result jsonb;begin
 if auth.uid()is null then raise exception 'Sign in to share a collection'using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,2));
 select jsonb_build_object('title',c.title,'photos',(select coalesce(jsonb_agg(jsonb_build_object('id',h.id,'title',h.title,'storage_path',h.storage_path,'image_url',s.image_url)order by h.created_at,h.id),'[]')from public.customer_haircuts h left join public.hairstyles s on s.id=h.hairstyle_id where h.collection_id=c.id and h.deleted_at is null))into result
 from public.haircut_collections c where c.id=p_collection and c.customer_id=auth.uid()and c.deleted_at is null;
 if result is null then raise exception 'Collection unavailable'using errcode='42501';end if;
 if jsonb_array_length(result->'photos')not between 1 and 20 then raise exception 'Add a photo to this collection first';end if;return result;
end;$$;
create function bookmyturn_private.attach_collection(p_visit uuid,p_kind text,p_collection uuid,p_snapshot jsonb)returns void language plpgsql security definer set search_path=''as $$declare salon uuid;first_photo jsonb:=p_snapshot->'photos'->0;begin
 if p_kind='queue'then select salon_id into salon from public.queue_entries where id=p_visit and customer_id=auth.uid()and status in('joined','arrived');
 else select salon_id into salon from public.appointments where id=p_visit and customer_id=auth.uid()and status in('pending','alternative_suggested','confirmed','arrived');end if;
 if salon is null then raise exception 'Active visit not found'using errcode='42501';end if;
 insert into bookmyturn_private.haircut_references(salon_id,customer_id,favorite_id,collection_id,queue_entry_id,appointment_id,title,storage_path,image_url,images)
 values(salon,auth.uid(),(first_photo->>'id')::uuid,p_collection,case when p_kind='queue'then p_visit end,case when p_kind='appointment'then p_visit end,p_snapshot->>'title',first_photo->>'storage_path',first_photo->>'image_url',p_snapshot->'photos')on conflict do nothing;
end;$$;
alter function bookmyturn_private.customer_command(text,jsonb)rename to customer_photo_command_v1;
create function bookmyturn_private.customer_command(p_action text,p_data jsonb)returns jsonb language plpgsql security definer set search_path=''as $$declare collection uuid:=(p_data->>'collection_id')::uuid;snapshot jsonb;result jsonb;begin
 if collection is null or p_action not in('join_queue','request_appointment')then return bookmyturn_private.customer_photo_command_v1(p_action,p_data);end if;
 if p_data->>'haircut_id'is not null then raise exception 'Choose a photo or a collection';end if;
 snapshot:=bookmyturn_private.collection_snapshot(collection);
 result:=bookmyturn_private.customer_photo_command_v1(p_action,p_data);
 if not coalesce((result->>'existing')::boolean,false)then perform bookmyturn_private.attach_collection((result->>'id')::uuid,case when p_action='join_queue'then 'queue'else 'appointment'end,collection,snapshot);end if;
 return result;
end;$$;
create or replace function public.customer_command(p_action text,p_data jsonb)returns jsonb language sql security invoker set search_path=''as $$select bookmyturn_private.customer_command(p_action,p_data);$$;
alter function bookmyturn_private.qr_visit(text,text,text,jsonb)rename to qr_visit_single_photo;
create function bookmyturn_private.qr_visit(p_action text,p_slug text,p_token text,p_data jsonb default '{}')returns jsonb language plpgsql security definer set search_path=''as $$declare collection uuid:=(p_data->>'collection_id')::uuid;snapshot jsonb;result jsonb;begin
 if p_action='join'and collection is not null then
  if p_data->>'haircut_id'is not null then raise exception 'Choose a photo or a collection';end if;
  snapshot:=bookmyturn_private.collection_snapshot(collection);
 end if;
 result:=bookmyturn_private.qr_visit_single_photo(p_action,p_slug,p_token,p_data);
 if snapshot is not null then perform bookmyturn_private.attach_collection((result->>'id')::uuid,'queue',collection,snapshot);end if;return result;
end;$$;
create or replace function public.qr_visit(p_action text,p_slug text,p_token text,p_data jsonb default '{}')returns jsonb language sql security invoker set search_path=''as $$select bookmyturn_private.qr_visit(p_action,p_slug,p_token,p_data);$$;
create or replace function bookmyturn_private.barber_state(p_barber uuid)returns jsonb language plpgsql security definer set search_path=''as $$declare state jsonb;photos jsonb;begin
 state:=bookmyturn_private.display_visit_codes(bookmyturn_private.barber_state_pre_haircuts(p_barber));
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'queue_entry_id',r.queue_entry_id,'appointment_id',r.appointment_id,'note',null,'viewed_at',r.viewed_at,'collection_title',case when r.collection_id is not null then r.title end,'images',case when jsonb_array_length(r.images)>0 then r.images else jsonb_build_array(jsonb_build_object('id',r.id,'title',r.title,'image_url',r.image_url,'storage_path',r.storage_path))end)),'[]')into photos
 from bookmyturn_private.haircut_references r where bookmyturn_private.can_read_haircut(r.id)and(r.queue_entry_id in(select(q->>'id')::uuid from jsonb_array_elements(state->'queues')q)or r.appointment_id in(select(a->>'id')::uuid from jsonb_array_elements(state->'appointments')a));
 return state||jsonb_build_object('styles',coalesce(state->'styles','[]')||photos);
end;$$;
create or replace function bookmyturn_private.haircut_media_read(p_path text)returns boolean language sql stable security definer set search_path=''as $$
 select auth.uid()is not null and(split_part(p_path,'/',1)=auth.uid()::text or exists(select 1 from bookmyturn_private.haircut_references r where(r.storage_path=p_path or r.images @> jsonb_build_array(jsonb_build_object('storage_path',p_path)))and bookmyturn_private.can_read_haircut(r.id)));
$$;
create or replace function bookmyturn_private.haircut_media_delete(p_path text)returns boolean language sql stable security definer set search_path=''as $$
 select auth.uid()is not null and split_part(p_path,'/',1)=auth.uid()::text and not exists(select 1 from public.customer_haircuts where storage_path=p_path and deleted_at is null)
 and not exists(select 1 from bookmyturn_private.haircut_references where storage_path=p_path or images @> jsonb_build_array(jsonb_build_object('storage_path',p_path)));
$$;
revoke all on function bookmyturn_private.photo_collection(),bookmyturn_private.customer_collections(text,jsonb),public.customer_collections(text,jsonb),bookmyturn_private.collection_snapshot(uuid),bookmyturn_private.attach_collection(uuid,text,uuid,jsonb),bookmyturn_private.customer_photo_command_v1(text,jsonb),bookmyturn_private.customer_command(text,jsonb),bookmyturn_private.qr_visit_single_photo(text,text,text,jsonb),bookmyturn_private.qr_visit(text,text,text,jsonb)from public,anon,authenticated;
grant execute on function bookmyturn_private.customer_collections(text,jsonb),public.customer_collections(text,jsonb),bookmyturn_private.customer_command(text,jsonb),bookmyturn_private.qr_visit(text,text,text,jsonb)to authenticated;
grant execute on function bookmyturn_private.qr_visit(text,text,text,jsonb)to anon;
notify pgrst,'reload schema';
commit;
