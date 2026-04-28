-- Launch-critical meaning updates
-- Generated: 2026-04-28T22:23:46.433936
-- Total updates: enriched names from external dictionary
-- Apply with: psql $DATABASE_URL < launch-critical-meaning-updates.sql

BEGIN;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GABRIEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God has healed; divine healer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('RAPHAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; bear-man; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ARTHUR') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOUIS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; descended from Jupiter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULES') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ADAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Chief; prince; generous lord', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUCAS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mind; intellect; spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('HUGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOAH') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LIAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From Gabium; white hawk', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GABIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SACHA') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('PAUL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NATHAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AARON') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MOHAMED') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ETHAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Delight, paradise; place of pleasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EDEN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Twin; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TOM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉON') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest, comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOÉ') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TIAGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ISAAC') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Of the sea; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARIUS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Attainer; achiever; winner', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little fire; fiery one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AYDEN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Father of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AXEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright fame; famed; shining', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROBIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Honoring God; I honor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TIMÉO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Home ruler; winner; giant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ENZO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little warrior; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARCEAU') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious; boy; great-grandson', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NINO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ELIOTT') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; healthy; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VALENTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Champion; chariot fighter; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOLAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright pledge; shining guarantee', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MALO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; soldier; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MILO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; beyond praise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ANTOINE') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SAMUEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great, magnificent; venerable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AUGUSTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Prince; commander; treetop', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AMIR') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Determined protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gates of paradise; green; lush', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('RAYAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('YANIS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GABRIEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God has healed; divine healer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('RAPHAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Chief; prince; generous lord', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOUIS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOAH') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; descended from Jupiter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULES') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; bear-man; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ARTHUR') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ADAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUCAS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LIAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SACHA') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ISAAC') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From Gabium; white hawk', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GABIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Delight, paradise; place of pleasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EDEN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mind; intellect; spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('HUGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Attainer; achiever; winner', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AARON') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MOHAMED') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉON') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('PAUL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest, comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOÉ') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little warrior; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARCEAU') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ETHAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NATHAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Twin; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TOM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious; boy; great-grandson', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NINO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Of the sea; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARIUS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little fire; fiery one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AYDEN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright pledge; shining guarantee', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MALO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Treasurer; keeper of the treasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GASPARD') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Determined protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gates of paradise; green; lush', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('RAYAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Sun; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ELIO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Honoring God; I honor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TIMÉO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ELIOTT') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; soldier; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MILO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright fame; famed; shining', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROBIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TIAGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; healthy; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VALENTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Father of many; exalted father', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('IBRAHIM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Father of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AXEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great, magnificent; venerable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AUGUSTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Prince; commander; treetop', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AMIR') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Home ruler; winner; giant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ENZO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Exalted nation; prosperity', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('IMRAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GABRIEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God has healed; divine healer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('RAPHAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOUIS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; bear-man; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ARTHUR') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; descended from Jupiter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULES') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Chief; prince; generous lord', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOAH') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ADAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUCAS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mind; intellect; spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('HUGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From Gabium; white hawk', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GABIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LIAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SACHA') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AARON') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉON') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ISAAC') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('PAUL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NATHAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest, comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOÉ') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Delight, paradise; place of pleasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EDEN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MOHAMED') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ETHAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Twin; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TOM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright pledge; shining guarantee', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MALO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Attainer; achiever; winner', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Of the sea; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARIUS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious; boy; great-grandson', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NINO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little warrior; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARCEAU') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little fire; fiery one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AYDEN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; soldier; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MILO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TIAGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright fame; famed; shining', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROBIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Father of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AXEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Honoring God; I honor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TIMÉO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Determined protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ELIOTT') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Home ruler; winner; giant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ENZO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; beyond praise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ANTOINE') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Champion; chariot fighter; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOLAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great, magnificent; venerable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AUGUSTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Treasurer; keeper of the treasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GASPARD') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; healthy; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VALENTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Prince; commander; treetop', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AMIR') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Courteous, kind; order, universe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CÔME') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SAMUEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GABRIEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God has healed; divine healer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('RAPHAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOUIS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Chief; prince; generous lord', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOAH') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; descended from Jupiter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULES') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ADAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; bear-man; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ARTHUR') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ISAAC') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LIAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SACHA') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Delight, paradise; place of pleasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EDEN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUCAS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From Gabium; white hawk', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GABIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉON') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MOHAMED') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mind; intellect; spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('HUGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Attainer; achiever; winner', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NAËL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest, comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOÉ') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little warrior; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARCEAU') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AARON') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('PAUL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ETHAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little fire; fiery one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AYDEN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NATHAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Of the sea; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARIUS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Father of many; exalted father', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('IBRAHIM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright pledge; shining guarantee', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MALO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Sun; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ELIO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Twin; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TOM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious; boy; great-grandson', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NINO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ELIOTT') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Determined protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Treasurer; keeper of the treasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GASPARD') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Exalted nation; prosperity', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('IMRAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great, magnificent; venerable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AUGUSTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; soldier; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MILO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright fame; famed; shining', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROBIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; healthy; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VALENTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Honoring God; I honor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TIMÉO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion man; brave as a lion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉANDRE') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Father of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AXEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; beyond praise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ANTOINE') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Champion; chariot fighter; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOLAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Courteous, kind; order, universe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CÔME') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Precious green stone; side stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JADE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOUISE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EMMA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALICE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Amber; precious jewel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AMBRE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LINA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rose flower; beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROSE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHLOÉ') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; meadow; lioness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ANNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MILA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rosemary; dew of the sea; from Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROMY') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOU') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('INÈS') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining; alluring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Good, virtuous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AGATHE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy; little Julia', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULIETTE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Care; concern; divine protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('INAYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NINA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ZOÉ') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JEANNE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lioness; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉONIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rainbow; messenger of the gods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('IRIS') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EVA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHARLIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Sorrows; strong woman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOLA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ADÈLE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VICTOIRE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wished-for child; bitter grace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MANON') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young ceremonial attendant; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CAMILLE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Roman woman; citizen of Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROMANE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; born at daylight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUCIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARGAUX') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('OLIVIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VICTORIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALIX') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOUNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great one; emerald; mine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SOFIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHARLOTTE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SARAH') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GIULIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; bearer of good news', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARGOT') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; radiance; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOUR') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Graceful vine; soft, tender', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYANA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Nasturtium flower; hooded cloak', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CAPUCINE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Precious green stone; side stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JADE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOUISE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EMMA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Amber; precious jewel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AMBRE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALICE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rose flower; beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROSE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ANNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dawn; white', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALBA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rosemary; dew of the sea; from Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROMY') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LINA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOU') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHLOÉ') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining; alluring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; meadow; lioness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Good, virtuous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AGATHE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rainbow; messenger of the gods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('IRIS') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NINA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Care; concern; divine protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('INAYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy; little Julia', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULIETTE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ZOÉ') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lioness; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉONIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JEANNE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHARLIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EVA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MILA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ADÈLE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VICTOIRE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('OLIVIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('INÈS') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Sorrows; strong woman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOLA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VICTORIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; born at daylight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUCIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARGAUX') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Roman woman; citizen of Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROMANE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GIULIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young ceremonial attendant; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CAMILLE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SOFIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHARLOTTE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALIX') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; radiance; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOUR') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Graceful vine; soft, tender', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYANA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARGOT') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SARAH') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOUNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great one; emerald; mine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wished-for child; bitter grace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MANON') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; bearer of good news', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Precious green stone; side stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JADE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOUISE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Amber; precious jewel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AMBRE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dawn; white', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALBA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EMMA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rose flower; beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROSE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALICE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rosemary; dew of the sea; from Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROMY') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ANNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LINA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining; alluring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOU') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHLOÉ') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Nourishing; soul; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALMA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Good, virtuous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AGATHE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rainbow; messenger of the gods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('IRIS') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Care; concern; divine protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('INAYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHARLIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy; little Julia', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULIETTE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; meadow; lioness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VICTOIRE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GIULIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ADÈLE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JEANNE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NINA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EVA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('OLIVIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ZOÉ') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lioness; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉONIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Roman woman; citizen of Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROMANE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VICTORIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; radiance; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOUR') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; bearer of good news', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('INÈS') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; born at daylight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUCIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Graceful vine; soft, tender', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYANA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Sorrows; strong woman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOLA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALIX') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHARLOTTE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MILA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SOFIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOUNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARGAUX') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; living one; birdlike', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AVA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ELENA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rival; industrious; universal', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EMY') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great one; emerald; mine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOUISE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Amber; precious jewel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AMBRE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dawn; white', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALBA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Precious green stone; side stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JADE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EMMA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rose flower; beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROSE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Nourishing; soul; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALMA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALICE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rosemary; dew of the sea; from Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROMY') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ANNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EVA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LINA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Good, virtuous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AGATHE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Care; concern; divine protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('INAYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOU') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rainbow; messenger of the gods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('IRIS') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining; alluring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GIULIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHARLIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ADÈLE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VICTOIRE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('OLIVIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHLOÉ') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; meadow; lioness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JEANNE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy; little Julia', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULIETTE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NINA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; radiance; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOUR') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lioness; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LÉONIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ZOÉ') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SOFIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VICTORIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Roman woman; citizen of Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROMANE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Sorrows; strong woman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOLA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; bearer of good news', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; living one; birdlike', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AVA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Exalted, sublime; sky, heaven', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALYA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; born at daylight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUCIE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALIX') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHARLOTTE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Graceful vine; soft, tender', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LYANA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ELENA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('INÈS') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MILA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rival; industrious; universal', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EMY') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARGAUX') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'White, bright; from Alba', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALBANE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Noah') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Matteo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elias') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leon') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Paul') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luca') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rival; eager; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emil') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Fair; white; blessed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Finn') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ruler of the home; estate ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Henry') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Louis') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Happy; fortunate; lucky', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Felix') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Liam') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son; son of the right hand', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ben') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; invaluable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anton') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; held by the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jakob') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dove; peaceful being', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jonas') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Divine spear; deer friend', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Oskar') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mohammed') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The greatest', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Maximilian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Joined; attached; pledged', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Levi') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dear; loving', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Milan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dove; God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jona') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('David') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Karl') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Adam') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jannis') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dark-skinned; Moorish', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Moritz') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Samuel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The greatest', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Max') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mats') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Alexander') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God has healed; divine healer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Raphael') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God has given', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jonathan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Flax; flaxen-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Linus') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aaron') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Carlo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; soldier; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Milo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Julian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Theodor') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; healthy; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Valentin') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brave lion; strong as a lion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leonard') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emilio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Who is like God?; beautiful fragrance', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mika') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Johann') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lover of horses', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Philipp') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ever-ruler; eternal ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Erik') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emilia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sophia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emma') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Hannah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lina') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mila') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beautiful fairy; all; completely', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ella') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; clear; famous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Clara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; meadow; lioness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lea') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Marie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright, shining light; torch', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leni') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bearer of good news; weary', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mathilda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; prosperous; hardworking', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ida') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Peaceful; peaceful ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Frieda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lily flower; pure, innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lilly') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emily') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lioness; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leonie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Charlotte') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luisa') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sophie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining; alluring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lena') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Johanna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nora') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wonderful; peace; ocean; admirable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mira') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Cheerful; famous; citadel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Calm, peaceful waters', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Malia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright, shining one; horn', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nele') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sarah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young; desired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Juna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; strong and feminine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lotta') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Paula') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rosemary; dew of the sea; from Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Romy') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my oath; pledged to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elisa') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved; wished-for child; sea of bitterness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Maria') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Helena') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Goddess; divine gift', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Thea') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Laurel; victory; honor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Laura') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; beyond praise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Antonia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bitter; sea; eternal; joy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Victoria') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elena') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; hardworking', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Amalia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mighty in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Tilda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Carla') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brave lion; strong as a lion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leonardo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wealthy guardian; rich protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Edoardo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Tommaso') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mattia') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Alessandro') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free man; Frenchman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Francesco') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From Laurentum; crowned with laurel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lorenzo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gabriele') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brave ruler; strong in power', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Riccardo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brave; manly; courageous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Andrea') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; he who replaces', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Diego') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Praised one; the one who is praised', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Enea') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Matteo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Giuseppe') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; invaluable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Antonio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory of the people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nicolo''') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Peaceful ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Federico') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God has heard; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Samuele') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rock; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Pietro') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lover of horses', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Filippo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Giovanni') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; descended from Jupiter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Giulio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Noah') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elia') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved; dear one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Davide') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Who is like God?', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Michele') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is willing; Yahweh is God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gioele') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gabriel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Christian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Liam') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Marco') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Thomas') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Savior; rescuer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Salvatore') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Conquering; victorious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Vincenzo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is with us', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emanuele') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Steadfast; holding fast', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ettore') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luca') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nathan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Farmer; earth worker', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Giorgio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; holder of the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jacopo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; holder of the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Giacomo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender; helper', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Alessio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Head of hair; emperor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Cesare') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'To tame; to subdue', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Damiano') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Samuel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luigi') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Daniele') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God has healed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Raffaele') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Saint James; supplanter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Santiago') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He has heard; listening', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Simone') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sofia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dawn; goddess of the morning', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aurora') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'White wave; fair one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ginevra') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Vittoria') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Giulia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'She who brings happiness; blessed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Beatrice') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ludovica') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Matilde') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Alice') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emma') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young ceremonial attendant; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Camilla') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'White; pure; shining', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Bianca') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Greta') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Sky blue; azure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Azzurra') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory of the people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nicole') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my oath; pledged to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Isabel') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; clear; famous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Chiara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Farmer; earth worker', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Giorgia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Most holy; very pure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Arianna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Earth; goddess of the earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gaia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Amber; precious jewel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ambra') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pleasantness; my delight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Noemi') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Martina') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Adele') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elena') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'To bind; captivating; snare', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Rebecca') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Divine; heavenly; goddess of the moon', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Diana') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Violet flower; purple', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Viola') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pearl; daisy flower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Margherita') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Blind to one''s own beauty; sixth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Cecilia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anita') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Sun; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sole') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Chloe') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free one; from France', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Francesca') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emily') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Joy; delight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gioia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Woman of Rome; purity', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lavinia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; hardworking; striving', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Amelia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nina') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Carlotta') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Eleonora') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lady; mistress of the house', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Marta') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my oath; pledged to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elisa') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Olivia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Heavenly; celestial', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Celeste') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Eva') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Noah') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luca') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lucas') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Liam') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Name; renown; fame', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sem') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mees') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bold courage; brave like a wolf', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Noud') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Joined; attached; pledged', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Levi') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('James') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Adam') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Fair; white; blessed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Finn') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Daan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sam') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dear; loving', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Milan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; bringer of light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luuk') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great, magnificent; venerable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Guus') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beauty; grace; ornament', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Zayn') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mats') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Stone worker; stone mason', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mason') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Father of many', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Bram') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Hearing; listening; obedient', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Siem') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Swiftness; strength is in him', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Boaz') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace; ancestor''s descendant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Oliver') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Olivier') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of the right hand; son of the south', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Benjamin') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright pledge; shining hostage', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gijs') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Flowering; prosperous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Floris') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift; God exists', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jesse') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joep') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Teun') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wealthy; keen of hearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Otis') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; held by the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jake') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dark-skinned; Moorish', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Morris') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Drawn from the water; saved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Moos') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jens') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ties') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elias') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Breath; son', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Abel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young warrior; noble; well-born', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Owen') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Thomas') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God; wealthy guardian', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ted') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The greatest', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Max') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('David') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Julian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mohammed') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Farmer; earth worker', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jurre') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is good; goodness of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Tobias') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Sea; ocean; forgiveness; willow tree', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Kai') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emma') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Olivia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nora') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Julia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sophie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mila') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small butterfly; water lady; spring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Yara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Zoë') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Harvester; reaper', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Tess') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright, shining light; torch', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elin') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Intoxicating; she who rules', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Maeve') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious rival; gentle strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Milou') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nina') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Princess; noble lady', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Saar') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; living one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Evi') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Eva') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lotte') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; protection; shelter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Liv') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mighty in battle; powerful strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Maud') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sofia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emily') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beautiful fairy; all; completely', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ella') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Laurel wreath; honor; victory', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lauren') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lina') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lake; waterfall; pool', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lynn') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sophia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sofie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Movement; motion; rest', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Noa') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Julie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lily flower; purity; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lily') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Better; more desirable; famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Loïs') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Hay meadow; heroine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Hailey') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved ruler; dear one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lieke') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Blue; envious; olive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Livia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Hannah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Peace; peaceful one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Fenna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'New; bright star; chasing butterflies', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nova') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest, comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Noé') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sarah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Fine, delicate; gentle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Fien') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Jasmine flower; gift from God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jasmijn') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Iron-willed; devoted to God; Jesus', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Isa') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my oath; devoted to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Isabella') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pilgrim to Rome; Roman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Romée') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mind; intellect; spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('HUGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MATEO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARTIN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LEO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUCAS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is with us', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MANUEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('PABLO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALEJANDRO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Home ruler; winner; giant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ENZO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('DANIEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Guardian of all; elf warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALVARO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; may God protect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('THIAGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From the Adriatic Sea; rich, dark', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ADRIAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; bitter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARIO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LIAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; he who replaces', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('DIEGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUCA') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brown; armor; shield', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('BRUNO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace; ancestor''s descendant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('OLIVER') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Battle genius; war elf; saved from battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GONZALO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('DAVID') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALEX') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARCOS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Generous; joyful; stranger', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GAEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory of the people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NICOLAS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Who is like God?', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MIGUEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong-willed; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('IZAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARCO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; invaluable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ANTONIO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'New house; bright', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JAVIER') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JUAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GABRIEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Messenger of God; angel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ANGEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great tide; son of the sea', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('DYLAN') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CARLOS') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARC') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous ruler; renowned power', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('RODRIGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JOSE') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Possessing goodness; upholder of good', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('DARIO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ADAM') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SAMUEL') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOAH') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; may God protect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JAIME') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Farmer; earth-worker', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JORGE') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free man; Frenchman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('FRANCISCO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Saint James; supplanter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SANTIAGO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Servant; attendant; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SERGIO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Resolute protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GUILLERMO') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small; humble; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('PAU') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Eternal ruler; ever powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ERIC') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; graceful light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUCIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SOFIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARTINA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved; wished-for child; sea of bitterness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JULIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; healthy; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VALERIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('OLIVIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('EMMA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('PAULA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Meadow; fertile plain; star', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VEGA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Nourishing; soul; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALMA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Song; garden; vineyard', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CARMEN') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('DANIELA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CARLA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Cheerful; famous; citadel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LARA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('SARA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Listener; one who hears', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('JIMENA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Sorrows; strong woman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LOLA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Calm; festive; from Gaul', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('GALA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Movement; motion; rest', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NOA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dawn; white', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALBA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lame; enclosure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CLAUDIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CHLOE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; healthy; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VALENTINA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Glory; our people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AITANA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALEJANDRA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is with us', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MANUELA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From Triana; beyond the river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('TRIANA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Well-spoken; eloquent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LAIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Candle; fire; light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CANDELA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'April; to open', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ABRIL') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ANA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ZOE') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('INES') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VICTORIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Faith; truth; true', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('VERA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ELENA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From the Adriatic Sea; rich, dark', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ADRIANA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'White; shining; fair', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('BLANCA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CARLOTA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('NORA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Of the sea; from the sea', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARINA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dewdrops; morning dew', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ROCIO') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; clear; famous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('CLARA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bearer of good news; weary', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('LUNA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Princess; commander', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('AMIRA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lady; mistress of the house', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('MARTA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('ALICIA') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rock; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Pedro') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; may God protect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Thiago') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brown; armor; shield', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Bruno') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong as a bear; brave bear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Bernardo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion man; brave as a lion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leandro') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Antone') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ruler with counsel; wise leader', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ronaldo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small; humble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Paulo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Cristiano') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luiz') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Tiago') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joao') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Davi') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Matheus') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Peaceful ruler; prince of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Frederico') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Friend of the god Melqart; grace of Baal', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Amilcar') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will establish; raised by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joaquim') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mateus') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Christiano') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From the farmstead on the river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ayrton') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous ruler; renowned power', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Rui') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'To rejoice; happy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Caio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ruler of the home; estate ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Henrique') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous spear; renowned warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Rogerio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Determined protector; resolute guardian', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Guilherme') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Crow; Basque; raven', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Vasco') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He who supplants; taught by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Diogo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lover of horses', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Filipe') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ines') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Half-god; demi-divine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emidio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'To rejoice; happy one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Kaio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dedicated to Mars; warlike', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Marcio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Hawk; falcon', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Kauan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wealthy guardian; prosperous protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Edvardo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Steadfast; holding fast', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Heitor') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright, clear; radiant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Helder') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Happiness; bliss; good fortune', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Zorion') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Matilde') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'She who brings happiness; blessed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Beatriz') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joana') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ines') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Shining light; bright; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leonor') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Happy; content; graceful warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luana') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; clear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Catarina') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Devoted to God; my God is an oath', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Izabel') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God has healed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Rafaela') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Matilde') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warrior maiden; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Arminda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong in battle; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mafalda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Zealous; ardent; eager', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Zelia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luiza') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lua') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Star; fairy queen', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Tayna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Woman from Magdala; tower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Madalena') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brave; courageous; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Andreia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Davi') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace and humility; small and gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anapaula') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Graceful beauty; lovable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anabela') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of the people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Alexya') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will establish; raised by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joaquina') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From Lourdes; rocky cliff', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lurdes') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved; the bond', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Tais') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Vitoria') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Catia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Swallow bird; graceful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nayara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Will; determination; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Telma') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bitter grace and wealthy guardian', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mariaeduarda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beautiful God; divinely pretty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Deolinda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dark beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mylena') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lady of the water; water spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Iara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace and youthfulness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anajulia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace and brightness; graceful and clear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anaclara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wealthy guardian; prosperous protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Eduarda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength; strong woman of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gabrielly') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; wide and healthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Heloisa') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From the province of Lorraine; famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lorrane') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Devoted to God; beautiful promise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Isabelly') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace and free woman; graceful and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anacarolina') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rock; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Pedro') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; may God protect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Thiago') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brown; armor; shield', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Bruno') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong as a bear; brave bear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Bernardo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion man; brave as a lion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leandro') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Antone') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ruler with counsel; wise leader', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ronaldo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Small; humble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Paulo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Cristiano') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luiz') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Tiago') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joao') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Davi') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Matheus') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Peaceful ruler; prince of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Frederico') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Friend of the god Melqart; grace of Baal', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Amilcar') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will establish; raised by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joaquim') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mateus') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Christiano') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From the farmstead on the river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ayrton') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous ruler; renowned power', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Rui') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'To rejoice; happy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Caio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ruler of the home; estate ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Henrique') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous spear; renowned warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Rogerio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Determined protector; resolute guardian', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Guilherme') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Crow; Basque; raven', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Vasco') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He who supplants; taught by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Diogo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lover of horses', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Filipe') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ines') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Half-god; demi-divine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emidio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'To rejoice; happy one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Kaio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dedicated to Mars; warlike', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Marcio') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Hawk; falcon', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Kauan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wealthy guardian; prosperous protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Edvardo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Steadfast; holding fast', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Heitor') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright, clear; radiant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Helder') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Happiness; bliss; good fortune', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Zorion') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Matilde') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'She who brings happiness; blessed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Beatriz') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joana') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ines') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Shining light; bright; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leonor') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Happy; content; graceful warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luana') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; clear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Catarina') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Devoted to God; my God is an oath', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Izabel') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God has healed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Rafaela') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Matilde') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Warrior maiden; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Arminda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong in battle; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mafalda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Zealous; ardent; eager', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Zelia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luiza') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lua') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Star; fairy queen', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Tayna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Woman from Magdala; tower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Madalena') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brave; courageous; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Andreia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Davi') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace and humility; small and gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anapaula') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Graceful beauty; lovable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anabela') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of the people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Alexya') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will establish; raised by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joaquina') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From Lourdes; rocky cliff', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lurdes') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved; the bond', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Tais') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Vitoria') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pure; innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Catia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Swallow bird; graceful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nayara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Will; determination; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Telma') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bitter grace and wealthy guardian', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mariaeduarda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beautiful God; divinely pretty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Deolinda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dark beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mylena') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lady of the water; water spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Iara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace and youthfulness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anajulia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace and brightness; graceful and clear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anaclara') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wealthy guardian; prosperous protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Eduarda') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength; strong woman of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gabrielly') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Famous warrior; wide and healthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Heloisa') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From the province of Lorraine; famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lorrane') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Devoted to God; beautiful promise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Isabelly') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace and free woman; graceful and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anacarolina') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little hollow; descendant of the warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Logan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of Jack; God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jackson') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Samuel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; holder of the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jacob') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Happy; blessed; fortunate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Asher') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little fire', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aiden') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('John') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joseph') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mateo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('David') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luke') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Thankful; God has heard', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jayden') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Cart driver; transporter of goods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Carter') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Julian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Isaac') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gabriel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; invaluable; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anthony') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great tide; son of the sea', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Dylan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Thomas') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God supports; God heals', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Josiah') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brave; manly; courageous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Andrew') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elias') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is salvation', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joshua') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nathan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little king; descendant of the king', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ryan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From the Adriatic Sea; rich, dark', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Adrian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Christian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Soldier; merciful; gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Miles') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Crooked nose; bent river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Cameron') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ascension; my God; elevated', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Eli') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aaron') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will exalt; appointed by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jeremiah') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'East-facing town; eastern settlement', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Easton') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'To descend; flowing river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jordan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Champion; chariot fighter; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nolan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Citizen of Rome; strong; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Roman') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Land by the road; traveler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Waylon') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Father of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Axel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Of the brook; small stream', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Brooks') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright fame; shining glory', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Robert') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of the grey-haired one; son of the steward', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Greyson') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weaver; faithful wife', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Penelope') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gianna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Air; song; melody', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aria') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'My father''s joy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Abigail') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beautiful fairy; all; completely', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ella') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ruler of elves; wise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Avery') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The hazel tree; hazelnut', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Hazel') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nora') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Night; dark beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Layla') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lily flower; purity; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lily') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dawn; goddess of the morning', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aurora') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'New; bright star; chasing butterflies', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nova') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ellie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of Maud; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Madison') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; blessing; goodness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Grace') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Willow tree; graceful; freedom', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Willow') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Courageous; valiant; rye clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Riley') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Star; celestial star', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Stella') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Hannah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Victoria') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Born on Christmas Day; birthday', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Natalie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Zoe') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of Adam', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Addison') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; meadow; delicate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; born at daybreak', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lucy') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ivy plant; faithfulness; climbing vine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ivy') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lily flower; pure; innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lillian') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From the boar meadow; wild boar in a woodland clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Everly') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Caroline') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emilia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Armored head; helmeted chief', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Kennedy') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Listener; told by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Samantha') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Illusion; water; mother; great', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Maya') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'King''s meadow; royal field', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Kinsley') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pleasantness; my delight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Naomi') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rising, ascending; exalted one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aaliyah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elena') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sarah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Most holy; very holy one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ariana') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Allison') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gabriella') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Alice') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Woman from Magdala; tower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Madelyn') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Maiden; heart; core', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Cora') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Red precious stone; ruby', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ruby') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Eva') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Joined; attached; pledged', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Levi') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Venerable; revered; respected', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sebastian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jack') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Helper; aid; protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ezra') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Who is like God?', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Michael') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Daniel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young warrior; noble; well-born', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Owen') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Alexander') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Stone worker; stone mason', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mason') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ethan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little hollow; descendant of the warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Logan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of Jack; God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jackson') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Samuel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; holder of the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jacob') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Happy; blessed; fortunate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Asher') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little fire', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aiden') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('John') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joseph') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mateo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('David') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luke') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Thankful; God has heard', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jayden') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Cart driver; transporter of goods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Carter') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Julian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Isaac') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gabriel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; invaluable; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anthony') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great tide; son of the sea', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Dylan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Thomas') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God supports; God heals', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Josiah') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brave; manly; courageous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Andrew') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elias') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is salvation', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joshua') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nathan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little king; descendant of the king', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ryan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From the Adriatic Sea; rich, dark', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Adrian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Christian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Soldier; merciful; gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Miles') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Crooked nose; bent river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Cameron') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ascension; my God; elevated', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Eli') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aaron') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will exalt; appointed by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jeremiah') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Harp player; minstrel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Harper') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young ceremonial attendant; perfect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Camila') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sofia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Red; scarlet; bright red', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Scarlett') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my oath; pledged to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elizabeth') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Eleanor') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emily') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Chloe') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mila') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Purple; the violet flower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Violet') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weaver; faithful wife', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Penelope') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gianna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Air; song; melody', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aria') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'My father''s joy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Abigail') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beautiful fairy; all; completely', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ella') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ruler of elves; wise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Avery') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The hazel tree; hazelnut', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Hazel') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nora') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Night; dark beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Layla') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lily flower; purity; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lily') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dawn; goddess of the morning', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aurora') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'New; bright star; chasing butterflies', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nova') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ellie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of Maud; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Madison') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; blessing; goodness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Grace') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Willow tree; graceful; freedom', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Willow') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Courageous; valiant; rye clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Riley') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Star; celestial star', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Stella') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Hannah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Victoria') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Born on Christmas Day; birthday', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Natalie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Zoe') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of Adam', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Addison') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; meadow; delicate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; born at daybreak', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lucy') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ivy plant; faithfulness; climbing vine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ivy') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lily flower; pure; innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lillian') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From the boar meadow; wild boar in a woodland clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Everly') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Caroline') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emilia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Armored head; helmeted chief', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Kennedy') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Listener; told by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Samantha') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Illusion; water; mother; great', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Maya') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'King''s meadow; royal field', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Kinsley') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Pleasantness; my delight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Naomi') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rising, ascending; exalted one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aaliyah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Liam') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Noah') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace; ancestor''s descendant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Oliver') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('James') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'My God is Yahweh; the Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elijah') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God; divine gift', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Theodore') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ruler of the home; estate ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Henry') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lucas') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Resolute protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('William') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of the right hand; son of the south', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Benjamin') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Joined; attached; pledged', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Levi') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Venerable; revered; respected', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sebastian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jack') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Helper; aid; protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ezra') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Who is like God?', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Michael') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Daniel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young warrior; noble; well-born', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Owen') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Alexander') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Stone worker; stone mason', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mason') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ethan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little hollow; descendant of the warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Logan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of Jack; God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jackson') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Samuel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Supplanter; holder of the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jacob') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Happy; blessed; fortunate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Asher') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Little fire', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aiden') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('John') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joseph') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mateo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('David') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luke') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Thankful; God has heard', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Jayden') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Cart driver; transporter of goods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Carter') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Julian') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leo') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Isaac') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gabriel') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Priceless; invaluable; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Anthony') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Great tide; son of the sea', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Dylan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Thomas') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God supports; God heals', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Josiah') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Brave; manly; courageous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Andrew') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elias') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The Lord is salvation', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Joshua') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nathan') AND gender = 'boy'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Olivia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emma') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Charlotte') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; hardworking; striving', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Amelia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sophia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my oath; devoted to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Isabella') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; living one; birdlike', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ava') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wished-for child; beautiful bird', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Evelyn') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Luna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Harp player; minstrel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Harper') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young ceremonial attendant; perfect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Camila') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Sofia') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Red; scarlet; bright red', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Scarlett') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is my oath; pledged to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Elizabeth') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Eleanor') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Emily') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Chloe') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Mila') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Purple; the violet flower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Violet') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weaver; faithful wife', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Penelope') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Gianna') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Air; song; melody', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aria') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'My father''s joy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Abigail') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Beautiful fairy; all; completely', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ella') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ruler of elves; wise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Avery') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'The hazel tree; hazelnut', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Hazel') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nora') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Night; dark beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Layla') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lily flower; purity; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lily') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Dawn; goddess of the morning', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Aurora') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'New; bright star; chasing butterflies', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Nova') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ellie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of Maud; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Madison') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; blessing; goodness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Grace') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Willow tree; graceful; freedom', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Willow') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Courageous; valiant; rye clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Riley') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Star; celestial star', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Stella') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Hannah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Victoria') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Born on Christmas Day; birthday', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Natalie') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Zoe') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Son of Adam', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Addison') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Weary; meadow; delicate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Leah') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Light; born at daybreak', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lucy') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Ivy plant; faithfulness; climbing vine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Ivy') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'Lily flower; pure; innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Lillian') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

UPDATE baby_names SET meaning = 'From the boar meadow; wild boar in a woodland clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE lower(name) = lower('Everly') AND gender = 'girl'
    AND (meaning IS NULL OR btrim(meaning) = '')
    AND meaning_verified IS DISTINCT FROM true;

COMMIT;

-- Total SQL updates: 1211
