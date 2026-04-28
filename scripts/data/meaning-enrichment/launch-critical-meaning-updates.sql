-- Launch-critical meaning updates
-- Generated: 2026-04-28T22:23:46.433936
-- Total updates: enriched names from external dictionary
-- Apply with: psql $DATABASE_URL < launch-critical-meaning-updates.sql

BEGIN;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GABRIEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God has healed; divine healer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'RAPHAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; bear-man; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ARTHUR' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOUIS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; descended from Jupiter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULES' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ADAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Chief; prince; generous lord', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUCAS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mind; intellect; spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'HUGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOAH' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LIAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From Gabium; white hawk', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GABIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SACHA' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'PAUL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NATHAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AARON' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MOHAMED' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ETHAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Delight, paradise; place of pleasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EDEN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Twin; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TOM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉON' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest, comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOÉ' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TIAGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ISAAC' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Of the sea; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARIUS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Attainer; achiever; winner', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little fire; fiery one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AYDEN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Father of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AXEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright fame; famed; shining', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROBIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Honoring God; I honor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TIMÉO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Home ruler; winner; giant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ENZO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little warrior; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARCEAU' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious; boy; great-grandson', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NINO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ELIOTT' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; healthy; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VALENTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Champion; chariot fighter; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOLAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright pledge; shining guarantee', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MALO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; soldier; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MILO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; beyond praise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ANTOINE' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SAMUEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great, magnificent; venerable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AUGUSTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Prince; commander; treetop', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AMIR' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Determined protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gates of paradise; green; lush', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'RAYAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'YANIS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GABRIEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God has healed; divine healer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'RAPHAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Chief; prince; generous lord', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOUIS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOAH' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; descended from Jupiter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULES' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; bear-man; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ARTHUR' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ADAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUCAS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LIAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SACHA' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ISAAC' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From Gabium; white hawk', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GABIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Delight, paradise; place of pleasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EDEN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mind; intellect; spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'HUGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Attainer; achiever; winner', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AARON' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MOHAMED' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉON' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'PAUL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest, comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOÉ' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little warrior; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARCEAU' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ETHAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NATHAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Twin; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TOM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious; boy; great-grandson', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NINO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Of the sea; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARIUS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little fire; fiery one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AYDEN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright pledge; shining guarantee', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MALO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Treasurer; keeper of the treasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GASPARD' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Determined protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gates of paradise; green; lush', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'RAYAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Sun; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ELIO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Honoring God; I honor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TIMÉO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ELIOTT' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; soldier; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MILO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright fame; famed; shining', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROBIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TIAGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; healthy; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VALENTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Father of many; exalted father', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'IBRAHIM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Father of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AXEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great, magnificent; venerable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AUGUSTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Prince; commander; treetop', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AMIR' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Home ruler; winner; giant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ENZO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Exalted nation; prosperity', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'IMRAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GABRIEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God has healed; divine healer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'RAPHAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOUIS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; bear-man; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ARTHUR' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; descended from Jupiter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULES' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Chief; prince; generous lord', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOAH' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ADAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUCAS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mind; intellect; spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'HUGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From Gabium; white hawk', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GABIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LIAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SACHA' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AARON' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉON' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ISAAC' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'PAUL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NATHAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest, comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOÉ' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Delight, paradise; place of pleasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EDEN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MOHAMED' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ETHAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Twin; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TOM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright pledge; shining guarantee', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MALO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Attainer; achiever; winner', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Of the sea; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARIUS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious; boy; great-grandson', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NINO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little warrior; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARCEAU' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little fire; fiery one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AYDEN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; soldier; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MILO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TIAGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright fame; famed; shining', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROBIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Father of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AXEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Honoring God; I honor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TIMÉO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Determined protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ELIOTT' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Home ruler; winner; giant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ENZO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; beyond praise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ANTOINE' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Champion; chariot fighter; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOLAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great, magnificent; venerable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AUGUSTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Treasurer; keeper of the treasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GASPARD' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; healthy; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VALENTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Prince; commander; treetop', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AMIR' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Courteous, kind; order, universe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CÔME' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SAMUEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GABRIEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God has healed; divine healer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'RAPHAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOUIS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Chief; prince; generous lord', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOAH' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; descended from Jupiter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULES' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ADAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; bear-man; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ARTHUR' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ISAAC' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LIAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SACHA' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Delight, paradise; place of pleasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EDEN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUCAS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From Gabium; white hawk', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GABIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉON' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MOHAMED' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mind; intellect; spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'HUGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Attainer; achiever; winner', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NAËL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest, comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOÉ' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little warrior; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARCEAU' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AARON' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'PAUL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ETHAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little fire; fiery one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AYDEN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NATHAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Of the sea; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARIUS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Father of many; exalted father', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'IBRAHIM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright pledge; shining guarantee', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MALO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Sun; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ELIO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Twin; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TOM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious; boy; great-grandson', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NINO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ELIOTT' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Determined protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Treasurer; keeper of the treasure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GASPARD' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Exalted nation; prosperity', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'IMRAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great, magnificent; venerable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AUGUSTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; soldier; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MILO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright fame; famed; shining', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROBIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; healthy; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VALENTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Honoring God; I honor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TIMÉO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion man; brave as a lion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉANDRE' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Father of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AXEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; beyond praise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ANTOINE' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Champion; chariot fighter; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOLAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Courteous, kind; order, universe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CÔME' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Precious green stone; side stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JADE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOUISE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EMMA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALICE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Amber; precious jewel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AMBRE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LINA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rose flower; beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROSE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHLOÉ' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; meadow; lioness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ANNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MILA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rosemary; dew of the sea; from Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROMY' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOU' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'INÈS' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining; alluring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Good, virtuous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AGATHE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy; little Julia', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULIETTE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Care; concern; divine protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'INAYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NINA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ZOÉ' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JEANNE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lioness; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉONIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rainbow; messenger of the gods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'IRIS' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EVA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHARLIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Sorrows; strong woman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOLA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ADÈLE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VICTOIRE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wished-for child; bitter grace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MANON' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young ceremonial attendant; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CAMILLE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Roman woman; citizen of Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROMANE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; born at daylight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUCIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARGAUX' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'OLIVIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VICTORIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALIX' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOUNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great one; emerald; mine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SOFIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHARLOTTE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SARAH' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GIULIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; bearer of good news', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARGOT' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; radiance; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOUR' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Graceful vine; soft, tender', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYANA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Nasturtium flower; hooded cloak', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CAPUCINE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Precious green stone; side stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JADE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOUISE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EMMA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Amber; precious jewel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AMBRE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALICE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rose flower; beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROSE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ANNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dawn; white', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALBA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rosemary; dew of the sea; from Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROMY' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LINA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOU' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHLOÉ' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining; alluring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; meadow; lioness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Good, virtuous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AGATHE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rainbow; messenger of the gods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'IRIS' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NINA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Care; concern; divine protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'INAYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy; little Julia', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULIETTE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ZOÉ' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lioness; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉONIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JEANNE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHARLIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EVA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MILA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ADÈLE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VICTOIRE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'OLIVIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'INÈS' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Sorrows; strong woman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOLA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VICTORIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; born at daylight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUCIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARGAUX' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Roman woman; citizen of Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROMANE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GIULIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young ceremonial attendant; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CAMILLE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SOFIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHARLOTTE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALIX' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; radiance; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOUR' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Graceful vine; soft, tender', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYANA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARGOT' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SARAH' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOUNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great one; emerald; mine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wished-for child; bitter grace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MANON' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; bearer of good news', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Precious green stone; side stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JADE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOUISE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Amber; precious jewel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AMBRE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dawn; white', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALBA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EMMA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rose flower; beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROSE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALICE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rosemary; dew of the sea; from Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROMY' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ANNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LINA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining; alluring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOU' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHLOÉ' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Nourishing; soul; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALMA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Good, virtuous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AGATHE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rainbow; messenger of the gods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'IRIS' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Care; concern; divine protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'INAYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHARLIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy; little Julia', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULIETTE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; meadow; lioness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VICTOIRE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GIULIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ADÈLE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JEANNE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NINA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EVA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'OLIVIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ZOÉ' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lioness; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉONIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Roman woman; citizen of Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROMANE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VICTORIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; radiance; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOUR' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; bearer of good news', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'INÈS' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; born at daylight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUCIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Graceful vine; soft, tender', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYANA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Sorrows; strong woman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOLA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALIX' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHARLOTTE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MILA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SOFIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOUNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARGAUX' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; living one; birdlike', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AVA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ELENA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rival; industrious; universal', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EMY' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great one; emerald; mine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOUISE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Amber; precious jewel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AMBRE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dawn; white', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALBA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Precious green stone; side stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JADE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EMMA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rose flower; beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROSE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Nourishing; soul; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALMA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALICE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rosemary; dew of the sea; from Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROMY' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ANNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EVA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LINA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Good, virtuous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AGATHE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Care; concern; divine protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'INAYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOU' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rainbow; messenger of the gods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'IRIS' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining; alluring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GIULIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHARLIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ADÈLE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VICTOIRE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'OLIVIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHLOÉ' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; meadow; lioness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JEANNE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy; little Julia', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULIETTE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NINA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; radiance; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOUR' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lioness; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LÉONIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ZOÉ' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SOFIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VICTORIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Roman woman; citizen of Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROMANE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Sorrows; strong woman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOLA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; bearer of good news', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; living one; birdlike', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AVA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Exalted, sublime; sky, heaven', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALYA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; born at daylight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUCIE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALIX' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHARLOTTE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Graceful vine; soft, tender', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LYANA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ELENA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'INÈS' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MILA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rival; industrious; universal', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EMY' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARGAUX' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'White, bright; from Alba', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALBANE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Noah' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Matteo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elias' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leon' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Paul' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luca' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rival; eager; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emil' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Fair; white; blessed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Finn' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ruler of the home; estate ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Henry' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Louis' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Happy; fortunate; lucky', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Felix' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Liam' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son; son of the right hand', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ben' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; invaluable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anton' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; held by the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jakob' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dove; peaceful being', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jonas' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Divine spear; deer friend', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Oskar' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mohammed' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The greatest', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Maximilian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Joined; attached; pledged', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Levi' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dear; loving', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Milan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dove; God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jona' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'David' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Karl' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Adam' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jannis' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dark-skinned; Moorish', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Moritz' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Samuel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The greatest', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Max' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mats' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Alexander' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God has healed; divine healer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Raphael' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God has given', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jonathan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Flax; flaxen-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Linus' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aaron' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Carlo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; soldier; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Milo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Julian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Theodor' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; healthy; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Valentin' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brave lion; strong as a lion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leonard' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emilio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Who is like God?; beautiful fragrance', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mika' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Johann' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lover of horses', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Philipp' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ever-ruler; eternal ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Erik' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emilia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sophia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emma' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Hannah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lina' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mila' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beautiful fairy; all; completely', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ella' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; clear; famous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Clara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; meadow; lioness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lea' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Marie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright, shining light; torch', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leni' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bearer of good news; weary', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mathilda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; prosperous; hardworking', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ida' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Peaceful; peaceful ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Frieda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lily flower; pure, innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lilly' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emily' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lioness; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leonie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Charlotte' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned fighter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luisa' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sophie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining; alluring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lena' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Johanna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nora' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wonderful; peace; ocean; admirable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mira' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Cheerful; famous; citadel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Calm, peaceful waters', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Malia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright, shining one; horn', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nele' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sarah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young; desired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Juna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; strong and feminine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lotta' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Paula' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rosemary; dew of the sea; from Rome', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Romy' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my oath; pledged to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elisa' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved; wished-for child; sea of bitterness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Maria' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Helena' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Goddess; divine gift', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Thea' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Laurel; victory; honor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Laura' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; beyond praise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Antonia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bitter; sea; eternal; joy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Victoria' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elena' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; hardworking', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Amalia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mighty in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Tilda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Carla' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brave lion; strong as a lion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leonardo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wealthy guardian; rich protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Edoardo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Tommaso' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mattia' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Alessandro' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free man; Frenchman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Francesco' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From Laurentum; crowned with laurel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lorenzo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gabriele' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brave ruler; strong in power', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Riccardo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brave; manly; courageous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Andrea' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; he who replaces', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Diego' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Praised one; the one who is praised', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Enea' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Matteo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Giuseppe' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; invaluable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Antonio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory of the people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nicolo''' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Peaceful ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Federico' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God has heard; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Samuele' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rock; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Pietro' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lover of horses', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Filippo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Giovanni' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; descended from Jupiter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Giulio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Noah' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elia' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved; dear one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Davide' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Who is like God?', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Michele' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is willing; Yahweh is God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gioele' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gabriel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Christian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Liam' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Marco' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Thomas' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Savior; rescuer', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Salvatore' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Conquering; victorious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Vincenzo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is with us', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emanuele' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Steadfast; holding fast', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ettore' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luca' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nathan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Farmer; earth worker', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Giorgio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; holder of the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jacopo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; holder of the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Giacomo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender; helper', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Alessio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Head of hair; emperor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Cesare' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'To tame; to subdue', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Damiano' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Samuel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luigi' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Daniele' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God has healed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Raffaele' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Saint James; supplanter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Santiago' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He has heard; listening', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Simone' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sofia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dawn; goddess of the morning', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aurora' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'White wave; fair one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ginevra' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Vittoria' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Giulia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'She who brings happiness; blessed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Beatrice' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ludovica' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Matilde' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Alice' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emma' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young ceremonial attendant; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Camilla' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'White; pure; shining', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Bianca' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pearl', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Greta' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Sky blue; azure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Azzurra' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory of the people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nicole' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my oath; pledged to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Isabel' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; clear; famous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Chiara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Farmer; earth worker', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Giorgia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Most holy; very pure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Arianna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Earth; goddess of the earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gaia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Amber; precious jewel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ambra' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pleasantness; my delight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Noemi' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Martina' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Adele' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elena' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'To bind; captivating; snare', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Rebecca' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Divine; heavenly; goddess of the moon', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Diana' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Violet flower; purple', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Viola' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pearl; daisy flower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Margherita' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Blind to one''s own beauty; sixth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Cecilia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor; merciful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anita' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Sun; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sole' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Chloe' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free one; from France', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Francesca' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emily' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Joy; delight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gioia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Woman of Rome; purity', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lavinia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; hardworking; striving', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Amelia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nina' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Carlotta' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Eleonora' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lady; mistress of the house', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Marta' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my oath; pledged to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elisa' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Olivia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Heavenly; celestial', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Celeste' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Eva' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Noah' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luca' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lucas' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Liam' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Name; renown; fame', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sem' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mees' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bold courage; brave like a wolf', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Noud' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Joined; attached; pledged', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Levi' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'James' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Adam' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Fair; white; blessed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Finn' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Daan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sam' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dear; loving', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Milan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; bringer of light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luuk' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great, magnificent; venerable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Guus' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beauty; grace; ornament', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Zayn' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mats' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Stone worker; stone mason', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mason' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Father of many', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Bram' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Hearing; listening; obedient', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Siem' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Swiftness; strength is in him', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Boaz' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace; ancestor''s descendant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Oliver' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Olivier' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of the right hand; son of the south', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Benjamin' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright pledge; shining hostage', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gijs' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Flowering; prosperous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Floris' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift; God exists', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jesse' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joep' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Teun' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wealthy; keen of hearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Otis' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; held by the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jake' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dark-skinned; Moorish', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Morris' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Drawn from the water; saved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Moos' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jens' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ties' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elias' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Breath; son', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Abel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young warrior; noble; well-born', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Owen' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Thomas' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God; wealthy guardian', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ted' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The greatest', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Max' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'David' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Julian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Praiseworthy; praised one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mohammed' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Farmer; earth worker', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jurre' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is good; goodness of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Tobias' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Sea; ocean; forgiveness; willow tree', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Kai' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emma' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Olivia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nora' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Julia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sophie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mila' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small butterfly; water lady; spring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Yara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Zoë' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Harvester; reaper', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Tess' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright, shining light; torch', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elin' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Intoxicating; she who rules', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Maeve' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious rival; gentle strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Milou' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little girl; dreamer; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nina' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Princess; noble lady', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Saar' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; living one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Evi' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Eva' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lotte' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; protection; shelter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Liv' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mighty in battle; powerful strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Maud' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sofia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emily' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beautiful fairy; all; completely', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ella' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Laurel wreath; honor; victory', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lauren' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Tender; delicate; palm tree; sunlight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lina' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lake; waterfall; pool', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lynn' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sophia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sofie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Movement; motion; rest', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Noa' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Julie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lily flower; purity; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lily' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Better; more desirable; famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Loïs' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Hay meadow; heroine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Hailey' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved ruler; dear one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lieke' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Blue; envious; olive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Livia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Hannah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Peace; peaceful one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Fenna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'New; bright star; chasing butterflies', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nova' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest, comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Noé' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sarah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Fine, delicate; gentle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Fien' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Jasmine flower; gift from God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jasmijn' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Iron-willed; devoted to God; Jesus', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Isa' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my oath; devoted to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Isabella' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pilgrim to Rome; Roman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Romée' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mind; intellect; spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'HUGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MATEO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARTIN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LEO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUCAS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is with us', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MANUEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'PABLO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALEJANDRO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Home ruler; winner; giant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ENZO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'DANIEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Guardian of all; elf warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALVARO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; may God protect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'THIAGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From the Adriatic Sea; rich, dark', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ADRIAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; bitter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARIO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LIAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; he who replaces', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'DIEGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUCA' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brown; armor; shield', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'BRUNO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace; ancestor''s descendant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'OLIVER' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Battle genius; war elf; saved from battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GONZALO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'DAVID' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALEX' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARCOS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Generous; joyful; stranger', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GAEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory of the people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NICOLAS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Who is like God?', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MIGUEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong-willed; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'IZAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARCO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; invaluable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ANTONIO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'New house; bright', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JAVIER' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JUAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GABRIEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Messenger of God; angel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ANGEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great tide; son of the sea', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'DYLAN' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free man; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CARLOS' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; dedicated to Mars', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARC' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous ruler; renowned power', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'RODRIGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JOSE' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Possessing goodness; upholder of good', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'DARIO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Man; earth; red earth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ADAM' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SAMUEL' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOAH' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; may God protect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JAIME' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Farmer; earth-worker', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JORGE' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free man; Frenchman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'FRANCISCO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Saint James; supplanter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SANTIAGO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Servant; attendant; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SERGIO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Resolute protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GUILLERMO' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small; humble; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'PAU' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Eternal ruler; ever powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ERIC' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; graceful light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUCIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SOFIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warlike; of Mars; warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARTINA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved; wished-for child; sea of bitterness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy; soft-haired', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JULIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; healthy; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VALERIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'OLIVIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'EMMA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small; humble; little', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'PAULA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Meadow; fertile plain; star', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VEGA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Nourishing; soul; kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALMA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Song; garden; vineyard', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CARMEN' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'DANIELA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CARLA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Cheerful; famous; citadel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LARA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'SARA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Listener; one who hears', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'JIMENA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Sorrows; strong woman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LOLA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Calm; festive; from Gaul', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'GALA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Movement; motion; rest', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NOA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dawn; white', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALBA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lame; enclosure', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CLAUDIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CHLOE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; healthy; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VALENTINA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Glory; our people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AITANA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALEJANDRA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is with us', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MANUELA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From Triana; beyond the river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'TRIANA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Well-spoken; eloquent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LAIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Candle; fire; light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CANDELA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'April; to open', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ABRIL' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ANA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ZOE' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'INES' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VICTORIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Faith; truth; true', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'VERA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ELENA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From the Adriatic Sea; rich, dark', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ADRIANA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'White; shining; fair', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'BLANCA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CARLOTA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'NORA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Of the sea; from the sea', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARINA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dewdrops; morning dew', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ROCIO' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; clear; famous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'CLARA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bearer of good news; weary', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'LUNA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Princess; commander', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'AMIRA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lady; mistress of the house', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'MARTA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'ALICIA' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rock; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Pedro' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; may God protect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Thiago' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brown; armor; shield', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Bruno' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong as a bear; brave bear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Bernardo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion man; brave as a lion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leandro' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Antone' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ruler with counsel; wise leader', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ronaldo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small; humble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Paulo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Cristiano' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luiz' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Tiago' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joao' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Davi' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Matheus' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Peaceful ruler; prince of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Frederico' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Friend of the god Melqart; grace of Baal', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Amilcar' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will establish; raised by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joaquim' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mateus' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Christiano' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From the farmstead on the river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ayrton' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous ruler; renowned power', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Rui' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'To rejoice; happy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Caio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ruler of the home; estate ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Henrique' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous spear; renowned warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Rogerio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Determined protector; resolute guardian', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Guilherme' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Crow; Basque; raven', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Vasco' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He who supplants; taught by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Diogo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lover of horses', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Filipe' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ines' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Half-god; demi-divine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emidio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'To rejoice; happy one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Kaio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dedicated to Mars; warlike', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Marcio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Hawk; falcon', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Kauan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wealthy guardian; prosperous protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Edvardo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Steadfast; holding fast', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Heitor' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright, clear; radiant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Helder' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Happiness; bliss; good fortune', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Zorion' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Matilde' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'She who brings happiness; blessed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Beatriz' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joana' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ines' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Shining light; bright; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leonor' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Happy; content; graceful warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luana' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; clear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Catarina' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Devoted to God; my God is an oath', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Izabel' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God has healed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Rafaela' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Matilde' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warrior maiden; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Arminda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong in battle; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mafalda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Zealous; ardent; eager', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Zelia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luiza' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lua' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Star; fairy queen', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Tayna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Woman from Magdala; tower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Madalena' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brave; courageous; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Andreia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Davi' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace and humility; small and gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anapaula' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Graceful beauty; lovable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anabela' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of the people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Alexya' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will establish; raised by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joaquina' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From Lourdes; rocky cliff', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lurdes' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved; the bond', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Tais' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Vitoria' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Catia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Swallow bird; graceful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nayara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Will; determination; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Telma' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bitter grace and wealthy guardian', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mariaeduarda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beautiful God; divinely pretty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Deolinda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dark beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mylena' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lady of the water; water spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Iara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace and youthfulness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anajulia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace and brightness; graceful and clear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anaclara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wealthy guardian; prosperous protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Eduarda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength; strong woman of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gabrielly' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; wide and healthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Heloisa' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From the province of Lorraine; famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lorrane' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Devoted to God; beautiful promise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Isabelly' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace and free woman; graceful and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anacarolina' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rock; stone', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Pedro' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; may God protect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Thiago' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brown; armor; shield', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Bruno' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong as a bear; brave bear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Bernardo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion man; brave as a lion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leandro' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Antone' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ruler with counsel; wise leader', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ronaldo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Small; humble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Paulo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Cristiano' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luiz' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Tiago' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joao' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Davi' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Matheus' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Peaceful ruler; prince of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Frederico' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Friend of the god Melqart; grace of Baal', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Amilcar' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will establish; raised by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joaquim' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mateus' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Christiano' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From the farmstead on the river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ayrton' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous ruler; renowned power', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Rui' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'To rejoice; happy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Caio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ruler of the home; estate ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Henrique' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous spear; renowned warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Rogerio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Determined protector; resolute guardian', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Guilherme' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Crow; Basque; raven', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Vasco' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He who supplants; taught by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Diogo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lover of horses', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Filipe' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ines' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Half-god; demi-divine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emidio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'To rejoice; happy one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Kaio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dedicated to Mars; warlike', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Marcio' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Hawk; falcon', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Kauan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wealthy guardian; prosperous protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Edvardo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Steadfast; holding fast', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Heitor' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright, clear; radiant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Helder' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Happiness; bliss; good fortune', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Zorion' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Matilde' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'She who brings happiness; blessed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Beatriz' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joana' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; holy; chaste', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ines' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Shining light; bright; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leonor' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Happy; content; graceful warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luana' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; clear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Catarina' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Devoted to God; my God is an oath', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Izabel' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God has healed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Rafaela' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mighty in battle; strength in war', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Matilde' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Warrior maiden; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Arminda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong in battle; mighty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mafalda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Zealous; ardent; eager', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Zelia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; renowned in battle', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luiza' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lua' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Star; fairy queen', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Tayna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Woman from Magdala; tower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Madalena' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brave; courageous; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Andreia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Davi' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace and humility; small and gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anapaula' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Graceful beauty; lovable', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anabela' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of the people', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Alexya' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will establish; raised by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joaquina' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From Lourdes; rocky cliff', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lurdes' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved; the bond', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Tais' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Vitoria' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pure; innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Catia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Swallow bird; graceful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nayara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Will; determination; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Telma' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bitter grace and wealthy guardian', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mariaeduarda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beautiful God; divinely pretty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Deolinda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dark beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mylena' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lady of the water; water spirit', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Iara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace and youthfulness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anajulia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace and brightness; graceful and clear', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anaclara' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wealthy guardian; prosperous protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Eduarda' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength; strong woman of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gabrielly' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Famous warrior; wide and healthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Heloisa' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From the province of Lorraine; famous warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lorrane' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Devoted to God; beautiful promise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Isabelly' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace and free woman; graceful and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anacarolina' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little hollow; descendant of the warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Logan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of Jack; God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jackson' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Samuel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; holder of the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jacob' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Happy; blessed; fortunate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Asher' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little fire', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aiden' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'John' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joseph' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mateo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'David' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luke' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Thankful; God has heard', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jayden' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Cart driver; transporter of goods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Carter' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Julian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Isaac' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gabriel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; invaluable; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anthony' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great tide; son of the sea', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Dylan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Thomas' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God supports; God heals', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Josiah' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brave; manly; courageous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Andrew' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elias' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is salvation', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joshua' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nathan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little king; descendant of the king', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ryan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From the Adriatic Sea; rich, dark', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Adrian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Christian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Soldier; merciful; gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Miles' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Crooked nose; bent river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Cameron' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ascension; my God; elevated', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Eli' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aaron' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will exalt; appointed by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jeremiah' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'East-facing town; eastern settlement', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Easton' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'To descend; flowing river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jordan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Champion; chariot fighter; noble', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nolan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Citizen of Rome; strong; powerful', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Roman' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Land by the road; traveler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Waylon' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Father of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Axel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Of the brook; small stream', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Brooks' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright fame; shining glory', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Robert' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of the grey-haired one; son of the steward', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Greyson' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weaver; faithful wife', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Penelope' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gianna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Air; song; melody', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aria' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'My father''s joy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Abigail' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beautiful fairy; all; completely', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ella' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ruler of elves; wise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Avery' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The hazel tree; hazelnut', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Hazel' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nora' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Night; dark beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Layla' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lily flower; purity; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lily' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dawn; goddess of the morning', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aurora' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'New; bright star; chasing butterflies', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nova' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ellie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of Maud; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Madison' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; blessing; goodness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Grace' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Willow tree; graceful; freedom', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Willow' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Courageous; valiant; rye clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Riley' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Star; celestial star', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Stella' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Hannah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Victoria' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Born on Christmas Day; birthday', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Natalie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Zoe' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of Adam', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Addison' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; meadow; delicate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; born at daybreak', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lucy' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ivy plant; faithfulness; climbing vine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ivy' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lily flower; pure; innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lillian' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From the boar meadow; wild boar in a woodland clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Everly' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Caroline' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emilia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Armored head; helmeted chief', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Kennedy' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Listener; told by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Samantha' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Illusion; water; mother; great', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Maya' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'King''s meadow; royal field', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Kinsley' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pleasantness; my delight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Naomi' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rising, ascending; exalted one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aaliyah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elena' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Princess; noblewoman', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sarah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Most holy; very holy one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ariana' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble kind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Allison' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gabriella' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Noble; of noble birth', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Alice' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Woman from Magdala; tower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Madelyn' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Maiden; heart; core', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Cora' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Red precious stone; ruby', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ruby' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; living one; to breathe', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Eva' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Joined; attached; pledged', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Levi' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Venerable; revered; respected', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sebastian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jack' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Helper; aid; protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ezra' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Who is like God?', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Michael' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Daniel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young warrior; noble; well-born', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Owen' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Alexander' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Stone worker; stone mason', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mason' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ethan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little hollow; descendant of the warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Logan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of Jack; God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jackson' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Samuel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; holder of the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jacob' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Happy; blessed; fortunate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Asher' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little fire', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aiden' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'John' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joseph' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mateo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'David' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luke' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Thankful; God has heard', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jayden' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Cart driver; transporter of goods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Carter' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Julian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Isaac' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gabriel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; invaluable; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anthony' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great tide; son of the sea', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Dylan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Thomas' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God supports; God heals', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Josiah' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brave; manly; courageous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Andrew' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elias' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is salvation', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joshua' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nathan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little king; descendant of the king', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ryan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From the Adriatic Sea; rich, dark', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Adrian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Follower of Christ; anointed', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Christian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Soldier; merciful; gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Miles' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Crooked nose; bent river', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Cameron' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ascension; my God; elevated', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Eli' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'High mountain; exalted, enlightened', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aaron' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will exalt; appointed by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jeremiah' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Harp player; minstrel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Harper' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young ceremonial attendant; perfect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Camila' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sofia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Red; scarlet; bright red', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Scarlett' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my oath; pledged to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elizabeth' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Eleanor' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emily' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Chloe' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mila' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Purple; the violet flower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Violet' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weaver; faithful wife', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Penelope' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gianna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Air; song; melody', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aria' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'My father''s joy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Abigail' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beautiful fairy; all; completely', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ella' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ruler of elves; wise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Avery' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The hazel tree; hazelnut', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Hazel' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nora' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Night; dark beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Layla' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lily flower; purity; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lily' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dawn; goddess of the morning', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aurora' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'New; bright star; chasing butterflies', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nova' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ellie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of Maud; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Madison' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; blessing; goodness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Grace' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Willow tree; graceful; freedom', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Willow' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Courageous; valiant; rye clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Riley' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Star; celestial star', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Stella' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Hannah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Victoria' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Born on Christmas Day; birthday', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Natalie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Zoe' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of Adam', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Addison' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; meadow; delicate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; born at daybreak', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lucy' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ivy plant; faithfulness; climbing vine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ivy' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lily flower; pure; innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lillian' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From the boar meadow; wild boar in a woodland clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Everly' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Caroline' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emilia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Armored head; helmeted chief', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Kennedy' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Listener; told by God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Samantha' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Illusion; water; mother; great', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Maya' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'King''s meadow; royal field', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Kinsley' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Pleasantness; my delight', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Naomi' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rising, ascending; exalted one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aaliyah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong-willed warrior; protector', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Liam' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Rest; comfort; peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Noah' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace; ancestor''s descendant', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Oliver' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; he who follows', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'James' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'My God is Yahweh; the Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elijah' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God; divine gift', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Theodore' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ruler of the home; estate ruler', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Henry' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; luminous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lucas' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Resolute protector; strong-willed warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'William' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of the right hand; son of the south', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Benjamin' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Joined; attached; pledged', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Levi' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Venerable; revered; respected', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sebastian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jack' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Helper; aid; protection', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ezra' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Who is like God?', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Michael' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my judge', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Daniel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young warrior; noble; well-born', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Owen' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Defender of mankind', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Alexander' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Stone worker; stone mason', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mason' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Strong; firm; enduring', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ethan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little hollow; descendant of the warrior', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Logan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of Jack; God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jackson' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Heard by God; name of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Samuel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Supplanter; holder of the heel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jacob' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Happy; blessed; fortunate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Asher' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Little fire', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aiden' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'John' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God will add; he shall increase', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joseph' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mateo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beloved', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'David' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bringer of light; from Lucania', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luke' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Thankful; God has heard', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Jayden' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Cart driver; transporter of goods', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Carter' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Youthful; downy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Julian' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lion; brave', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leo' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He will laugh; laughter', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Isaac' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my strength', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gabriel' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Priceless; invaluable; praiseworthy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Anthony' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Great tide; son of the sea', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Dylan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Twin', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Thomas' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God supports; God heals', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Josiah' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Brave; manly; courageous', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Andrew' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is my God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elias' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The Lord is salvation', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Joshua' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'He gave; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nathan' AND gender = 'boy' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Olive tree; peace; symbol of peace', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Olivia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Whole; universal; all-embracing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emma' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Free woman; petite and strong', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Charlotte' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; hardworking; striving', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Amelia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sophia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my oath; devoted to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Isabella' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; living one; birdlike', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ava' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Mine; beloved; wished-for child', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wished-for child; beautiful bird', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Evelyn' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Moon; divine light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Luna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Harp player; minstrel', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Harper' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young ceremonial attendant; perfect', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Camila' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Wisdom; wise one', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Sofia' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Red; scarlet; bright red', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Scarlett' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is my oath; pledged to God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Elizabeth' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Eleanor' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Industrious; eager; rival', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Emily' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Young green shoot; blooming', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Chloe' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Gracious; dear; industrious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Mila' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Purple; the violet flower', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Violet' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weaver; faithful wife', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Penelope' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'God is gracious', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Gianna' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Air; song; melody', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aria' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'My father''s joy', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Abigail' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Beautiful fairy; all; completely', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ella' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ruler of elves; wise', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Avery' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'The hazel tree; hazelnut', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Hazel' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Honor; light; compassion', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nora' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Night; dark beauty', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Layla' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lily flower; purity; innocence', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lily' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Dawn; goddess of the morning', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Aurora' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'New; bright star; chasing butterflies', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Nova' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Bright; shining light', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ellie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of Maud; gift of God', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Madison' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; blessing; goodness', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Grace' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Willow tree; graceful; freedom', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Willow' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Courageous; valiant; rye clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Riley' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Star; celestial star', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Stella' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Grace; favor', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Hannah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Victory; conqueror', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Victoria' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Born on Christmas Day; birthday', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Natalie' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Life; alive', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Zoe' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Son of Adam', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Addison' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Weary; meadow; delicate', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Leah' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Light; born at daybreak', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lucy' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Ivy plant; faithfulness; climbing vine', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Ivy' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'Lily flower; pure; innocent', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Lillian' AND gender = 'girl' AND meaning IS NULL;

UPDATE baby_names SET meaning = 'From the boar meadow; wild boar in a woodland clearing', meaning_source = 'external_dictionary', meaning_confidence = 0.8
  WHERE name = 'Everly' AND gender = 'girl' AND meaning IS NULL;

COMMIT;

-- Total SQL updates: 1211
