-- ============================================
-- ARC SERVICE — Database schema (English naming)
-- ============================================

-- Clean up the French version if it was already created
drop table if exists historique_statuts cascade;

drop table if exists colis cascade;

drop table if exists destinataires cascade;

drop table if exists expediteurs cascade;

drop table if exists agents_agences_autorisees cascade;

drop table if exists agents cascade;

drop table if exists agences cascade;

create extension if not exists "pgcrypto";

-- ---------- AGENCIES ----------
create table agencies (
    id uuid primary key default gen_random_uuid (),
    name text not null, -- e.g. "Paris Agency"
    country text not null, -- e.g. "France"
    city text not null, -- e.g. "Paris"
    price_per_kg numeric(10, 2), -- e.g. 17.00 (Kinshasa) or 15.00 (Paris)
    currency text check (currency in ('USD', 'EUR')),
    created_at timestamptz not null default now()
);

-- ---------- AGENTS (linked to a Supabase Auth account) ----------
create table agents (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text not null,
    role text not null default 'agent' check (
        role in ('agent', 'manager', 'admin')
    ),
    default_agency_id uuid not null references agencies (id),
    created_at timestamptz not null default now()
);

-- Extra agencies an agent is allowed to switch to (multi-agency access)
create table agent_agency_access (
    agent_id uuid not null references agents (id) on delete cascade,
    agency_id uuid not null references agencies (id) on delete cascade,
    primary key (agent_id, agency_id)
);

-- ---------- SENDERS ----------
create table senders (
    id uuid primary key default gen_random_uuid (),
    last_name text not null,
    middle_name text, -- "postnom"
    first_name text not null,
    street text,
    neighborhood text,
    city text,
    id_type text not null check (
        id_type in (
            'passport',
            'voter_card',
            'driver_license',
            'other'
        )
    ),
    id_number text,
    whatsapp text not null,
    created_at timestamptz not null default now()
);

-- ---------- RECIPIENTS ----------
create table recipients (
    id uuid primary key default gen_random_uuid (),
    full_name text not null,
    phone text not null,
    country text not null,
    city text,
    created_at timestamptz not null default now()
);

-- ---------- PACKAGES ----------
create table packages (
    id uuid primary key default gen_random_uuid (),
    tracking_number text not null unique, -- e.g. TFE-2024-001478
    origin_agency_id uuid not null references agencies (id),
    destination_agency_id uuid not null references agencies (id),
    sender_id uuid not null references senders (id),
    recipient_id uuid not null references recipients (id),
    package_type text not null,
    details text,
    weight_kg numeric(10, 2) not null,
    price_per_kg numeric(10, 2) not null,
    price_per_kg_currency text check (price_per_kg_currency in ('USD', 'EUR')),
    total_amount numeric(10, 2) not null,
    payment_method text not null check (
        payment_method in (
            'cash',
            'mobile_money',
            'card'
        )
    ),
    amount_paid numeric(10, 2) not null default 0,
    status text not null default 'registered' check (
        status in (
            'registered',
            'in_transit',
            'arrived',
            'picked_up'
        )
    ),
    agent_id uuid not null references agents (id),
    created_at timestamptz not null default now()
);

-- ---------- STATUS HISTORY ----------
create table status_history (
    id uuid primary key default gen_random_uuid (),
    package_id uuid not null references packages (id) on delete cascade,
    status text not null check (
        status in (
            'registered',
            'in_transit',
            'arrived',
            'picked_up'
        )
    ),
    location text,
    comment text,
    picked_up_by_name text, -- filled only when status = 'picked_up'
    picked_up_by_id_document text, -- filled only when status = 'picked_up'
    agent_id uuid references agents (id),
    created_at timestamptz not null default now()
);

-- Useful indexes for frequent lookups
create index idx_packages_tracking_number on packages (tracking_number);

create index idx_packages_status on packages (status);

create index idx_packages_origin_agency on packages (origin_agency_id);

create index idx_status_history_package_id on status_history (package_id);