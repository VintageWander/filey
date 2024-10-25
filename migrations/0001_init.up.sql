-- Add up migration script here
create table
    files (
        id text primary key,
        name text not null,
        mime text not null,
        visibility text not null default "private" check (visibility in ("public", "private")),
        path text not null unique
    );
