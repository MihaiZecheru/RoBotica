CREATE TYPE public."TLanguage" AS ENUM (
    'Romanian',
    'Spanish',
    'French',
    'Italian',
    'Portuguese',
    'German'
);
CREATE TYPE public."TLevel" AS ENUM (
    'Beginner',
    'Intermediate'
);
CREATE TYPE public."TGender" AS ENUM (
    'Man',
    'Woman'
);
CREATE TABLE public."Conversations" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."LyricTranslationAndMeaning" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    song_id uuid NOT NULL,
    language text NOT NULL,
    lyric text NOT NULL,
    translation text NOT NULL,
    meaning text NOT NULL
);
CREATE TABLE public."Messages" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    message_content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_bot boolean NOT NULL
);
CREATE TABLE public."Songs" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    language text NOT NULL,
    title text NOT NULL,
    artist text NOT NULL,
    year integer,
    lyrics text NOT NULL,
    thumbnail_url text NOT NULL,
    image_url text NOT NULL,
    youtube_video_id text NOT NULL
);
CREATE TABLE public."Stories" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    language public."TLanguage" NOT NULL,
    title text NOT NULL,
    body text NOT NULL
);
CREATE TABLE public."StorySentenceTranslation" (
    language public."TLanguage" NOT NULL,
    sentence text NOT NULL,
    translation text NOT NULL,
    story_id uuid NOT NULL
);
CREATE TABLE public."UserSettings" (
    user_id uuid DEFAULT auth.uid() NOT NULL,
    level public."TLevel" DEFAULT 'Beginner'::public."TLevel" NOT NULL,
    language public."TLanguage" DEFAULT 'Romanian'::public."TLanguage" NOT NULL,
    gender public."TGender" DEFAULT 'Man'::public."TGender" NOT NULL
);
CREATE TABLE public."WordTranslationAndExamples" (
    word text NOT NULL,
    translation text NOT NULL,
    example_sentence1 text NOT NULL,
    example_sentence2 text NOT NULL,
    language text NOT NULL,
    example_sentence1_translation text NOT NULL,
    example_sentence2_translation text NOT NULL
);
