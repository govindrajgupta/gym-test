-- Create custom types for ENUMs if needed
DO $$ BEGIN
    CREATE TYPE role_type AS ENUM ('trainer', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE slot_status AS ENUM ('open', 'booked', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles (matches Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role role_type DEFAULT 'trainer'::role_type,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Workout Plans (Trainer creates)
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workout plans are viewable by trainer and their clients." ON public.workout_plans FOR SELECT USING (true); -- simplify to true for now
CREATE POLICY "Trainers can insert their own workout plans." ON public.workout_plans FOR INSERT WITH CHECK (auth.uid() = trainer_id);
CREATE POLICY "Trainers can update their own workout plans." ON public.workout_plans FOR UPDATE USING (auth.uid() = trainer_id);
CREATE POLICY "Trainers can delete their own workout plans." ON public.workout_plans FOR DELETE USING (auth.uid() = trainer_id);

-- 3. Workout Days
CREATE TABLE IF NOT EXISTS public.workout_days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE NOT NULL,
  day_name TEXT NOT NULL, -- e.g., "Day 1", "Monday", "Chest"
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workout days are viewable by everyone." ON public.workout_days FOR SELECT USING (true);
-- To keep it simple, we can allow full access to authenticated users or just rely on the API for these
CREATE POLICY "Authenticated users can insert workout days." ON public.workout_days FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update workout days." ON public.workout_days FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete workout days." ON public.workout_days FOR DELETE USING (auth.role() = 'authenticated');


-- 4. Exercises
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day_id UUID REFERENCES public.workout_days(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sets TEXT, -- e.g., "3", "5-8"
  reps_or_time TEXT, -- e.g., "8", "30 secs", "Failure"
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are viewable by everyone." ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert exercises." ON public.exercises FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update exercises." ON public.exercises FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete exercises." ON public.exercises FOR DELETE USING (auth.role() = 'authenticated');


-- 5. Trainer Availability
CREATE TABLE IF NOT EXISTS public.trainer_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL, -- e.g., "2024-07-24"
  start_time TIME NOT NULL, -- e.g., "11:30:00"
  end_time TIME NOT NULL, -- e.g., "11:45:00"
  session_name TEXT NOT NULL, -- e.g., "PT"
  is_repeat BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.trainer_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Availability is viewable by everyone." ON public.trainer_availability FOR SELECT USING (true);
CREATE POLICY "Trainers can manage their availability." ON public.trainer_availability FOR ALL USING (auth.uid() = trainer_id);

-- 6. Booked Slots
CREATE TABLE IF NOT EXISTS public.booked_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  availability_id UUID REFERENCES public.trainer_availability(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status slot_status DEFAULT 'booked'::slot_status,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (availability_id) -- One booking per available slot
);

ALTER TABLE public.booked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view their booked slots." ON public.booked_slots FOR SELECT USING (auth.uid() = client_id OR auth.uid() IN (SELECT trainer_id FROM trainer_availability WHERE id = availability_id));
CREATE POLICY "Clients can book slots." ON public.booked_slots FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can cancel their slots." ON public.booked_slots FOR UPDATE USING (auth.uid() = client_id);

-- Setup auth hook to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    null
  );
  return new;
end;
$$;

-- trigger the function every time a user is created
-- drop first if exists to easily recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
