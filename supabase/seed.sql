-- ============================================================
-- NameMatch – Seed Data
-- Run AFTER schema.sql to populate baby_names with sample data
-- In production, use the names from src/data/names.ts
-- ============================================================

-- Sample worldwide names
INSERT INTO public.baby_names (name, meaning, origin, gender, region, is_worldwide) VALUES
  ('Aria', 'Air; song or melody', 'Italian / Hebrew', 'girl', 'WORLDWIDE', true),
  ('Leo', 'Lion', 'Latin', 'boy', 'WORLDWIDE', true),
  ('Mia', 'Mine; beloved', 'Scandinavian / Italian', 'girl', 'WORLDWIDE', true),
  ('Luca', 'Bringer of light', 'Italian / Latin', 'boy', 'WORLDWIDE', true),
  ('Emma', 'Whole; universal', 'Germanic', 'girl', 'WORLDWIDE', true),
  ('Noah', 'Rest; comfort', 'Hebrew', 'boy', 'WORLDWIDE', true),
  ('Sofia', 'Wisdom', 'Greek', 'girl', 'WORLDWIDE', true),
  ('Oliver', 'Olive tree; peace', 'Latin / French', 'boy', 'WORLDWIDE', true),
  ('Luna', 'Moon', 'Latin', 'girl', 'WORLDWIDE', true),
  ('Elias', 'My God is the Lord', 'Hebrew / Greek', 'boy', 'WORLDWIDE', true),
  ('Isla', 'Island', 'Scottish', 'girl', 'WORLDWIDE', true),
  ('Ethan', 'Strong; firm', 'Hebrew', 'boy', 'WORLDWIDE', true),
  ('Zara', 'Blossom; flower', 'Arabic / Hebrew', 'girl', 'WORLDWIDE', true),
  ('Julian', 'Youthful; downy', 'Latin', 'boy', 'WORLDWIDE', true),
  ('Nora', 'Honor; light', 'Irish / Arabic', 'girl', 'WORLDWIDE', true);

-- Sample EU names
INSERT INTO public.baby_names (name, meaning, origin, gender, country, region, is_worldwide) VALUES
  ('Amélie', 'Hardworking; industrious', 'French', 'girl', 'France', 'EU', false),
  ('Antoine', 'Priceless one', 'French', 'boy', 'France', 'EU', false),
  ('Lorenzo', 'From Laurentum; laurel', 'Italian', 'boy', 'Italy', 'EU', false),
  ('Chiara', 'Bright; clear; famous', 'Italian', 'girl', 'Italy', 'EU', false),
  ('Björn', 'Bear', 'Scandinavian', 'boy', 'Sweden', 'EU', false),
  ('Astrid', 'Divinely beautiful; strength', 'Norse', 'girl', 'Norway', 'EU', false),
  ('Alejandro', 'Defender of mankind', 'Spanish', 'boy', 'Spain', 'EU', false),
  ('Lucía', 'Light', 'Spanish', 'girl', 'Spain', 'EU', false),
  ('Finn', 'Fair; white; clear', 'Irish / Norse', 'boy', 'Ireland', 'EU', false),
  ('Aoife', 'Beautiful; radiant', 'Irish', 'girl', 'Ireland', 'EU', false);

-- Sample US names
INSERT INTO public.baby_names (name, meaning, origin, gender, country, region, is_worldwide) VALUES
  ('Liam', 'Strong-willed warrior; protector', 'Irish / American', 'boy', 'USA', 'US', false),
  ('Olivia', 'Olive tree; peace', 'Latin / American', 'girl', 'USA', 'US', false),
  ('Mason', 'Stone worker', 'English / American', 'boy', 'USA', 'US', false),
  ('Charlotte', 'Free woman', 'French / American', 'girl', 'USA', 'US', false),
  ('Aiden', 'Little fire', 'Irish / American', 'boy', 'USA', 'US', false),
  ('Harper', 'Harp player', 'English / American', 'girl', 'USA', 'US', false),
  ('Maverick', 'Independent; nonconformist', 'American', 'boy', 'USA', 'US', false),
  ('Aurora', 'Dawn; goddess of the dawn', 'Latin / American', 'girl', 'USA', 'US', false),
  ('Asher', 'Happy; blessed', 'Hebrew / American', 'boy', 'USA', 'US', false),
  ('Hazel', 'Hazel tree; commander', 'English / American', 'girl', 'USA', 'US', false);

-- Sample Arabia names
INSERT INTO public.baby_names (name, meaning, origin, gender, country, region, is_worldwide) VALUES
  ('Mohammed', 'Praiseworthy; praised one', 'Arabic', 'boy', 'Saudi Arabia', 'ARABIA', false),
  ('Fatima', 'One who abstains; captivating', 'Arabic', 'girl', 'Saudi Arabia', 'ARABIA', false),
  ('Ahmed', 'Highly praised', 'Arabic', 'boy', 'Saudi Arabia', 'ARABIA', false),
  ('Aisha', 'Alive; living; prosperous', 'Arabic', 'girl', 'Saudi Arabia', 'ARABIA', false),
  ('Omar', 'Long-lived; flourishing', 'Arabic', 'boy', 'Saudi Arabia', 'ARABIA', false),
  ('Noor', 'Light; radiance', 'Arabic', 'neutral', 'Saudi Arabia', 'ARABIA', false),
  ('Yasmin', 'Jasmine flower', 'Arabic / Persian', 'girl', 'Saudi Arabia', 'ARABIA', false),
  ('Hassan', 'Handsome; good', 'Arabic', 'boy', 'Saudi Arabia', 'ARABIA', false),
  ('Layla', 'Night; dark-haired beauty', 'Arabic', 'girl', 'Saudi Arabia', 'ARABIA', false),
  ('Ibrahim', 'Father of many nations', 'Arabic / Hebrew', 'boy', 'Saudi Arabia', 'ARABIA', false);

-- Sample Asia names
INSERT INTO public.baby_names (name, meaning, origin, gender, country, region, is_worldwide) VALUES
  ('Kai', 'Sea; victory; forgiveness', 'Japanese / Chinese', 'neutral', 'Japan', 'ASIA', false),
  ('Sakura', 'Cherry blossom', 'Japanese', 'girl', 'Japan', 'ASIA', false),
  ('Kenji', 'Strong and vigorous second son', 'Japanese', 'boy', 'Japan', 'ASIA', false),
  ('Arjun', 'White; clear; silver', 'Sanskrit / Indian', 'boy', 'India', 'ASIA', false),
  ('Priya', 'Beloved; dear one', 'Sanskrit / Indian', 'girl', 'India', 'ASIA', false),
  ('Mei', 'Beautiful; plum blossom', 'Chinese', 'girl', 'China', 'ASIA', false),
  ('Wei', 'Greatness; power', 'Chinese', 'boy', 'China', 'ASIA', false),
  ('Seo-yeon', 'Auspicious; beautiful', 'Korean', 'girl', 'South Korea', 'ASIA', false),
  ('Min-jun', 'Quick; talented; handsome', 'Korean', 'boy', 'South Korea', 'ASIA', false),
  ('Nozomi', 'Hope; wish', 'Japanese', 'girl', 'Japan', 'ASIA', false);

-- Sample Latin America names
INSERT INTO public.baby_names (name, meaning, origin, gender, country, region, is_worldwide) VALUES
  ('Santiago', 'Saint James; supplanter', 'Spanish', 'boy', 'Argentina', 'LATIN_AMERICA', false),
  ('Valentina', 'Strong; healthy; brave', 'Spanish / Latin', 'girl', 'Colombia', 'LATIN_AMERICA', false),
  ('Sebastián', 'Venerable; revered', 'Spanish / Greek', 'boy', 'Colombia', 'LATIN_AMERICA', false),
  ('Isabella', 'God is my oath', 'Spanish / Italian', 'girl', 'Brazil', 'LATIN_AMERICA', false),
  ('Mateo', 'Gift of God', 'Spanish / Hebrew', 'boy', 'Mexico', 'LATIN_AMERICA', false),
  ('Camila', 'Young ceremonial attendant', 'Spanish / Latin', 'girl', 'Mexico', 'LATIN_AMERICA', false),
  ('Diego', 'Supplanter; teaching', 'Spanish / Hebrew', 'boy', 'Mexico', 'LATIN_AMERICA', false),
  ('Marisol', 'Sea and sun', 'Spanish', 'girl', 'Colombia', 'LATIN_AMERICA', false),
  ('Leonardo', 'Brave lion', 'Spanish / Italian', 'boy', 'Brazil', 'LATIN_AMERICA', false),
  ('Carmen', 'Garden; song; crimson', 'Spanish / Latin', 'girl', 'Colombia', 'LATIN_AMERICA', false);

-- Sample MENA names
INSERT INTO public.baby_names (name, meaning, origin, gender, country, region, is_worldwide) VALUES
  ('Cyrus', 'Sun; throne', 'Persian', 'boy', 'Iran', 'MENA', false),
  ('Shireen', 'Sweet; pleasant', 'Persian', 'girl', 'Iran', 'MENA', false),
  ('Emir', 'Prince; commander', 'Arabic / Turkish', 'boy', 'Turkey', 'MENA', false),
  ('Elif', 'Slender; first letter of Arabic alphabet', 'Turkish', 'girl', 'Turkey', 'MENA', false),
  ('Tarek', 'Morning star; who knocks at the door', 'Arabic', 'boy', 'Egypt', 'MENA', false),
  ('Nada', 'Dew; generosity', 'Arabic', 'girl', 'Egypt', 'MENA', false),
  ('Charbel', 'News of God', 'Aramaic / Lebanese', 'boy', 'Lebanon', 'MENA', false),
  ('Lara', 'Cheerful; protection', 'Russian / Greek (popular in MENA)', 'girl', 'Lebanon', 'MENA', false),
  ('Amir', 'Prince; ruler', 'Arabic / Persian', 'boy', 'Iran', 'MENA', false),
  ('Jana', 'Paradise; garden', 'Arabic', 'girl', 'Jordan', 'MENA', false);
