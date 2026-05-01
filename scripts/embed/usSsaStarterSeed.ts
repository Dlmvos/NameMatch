/**
 * Curated US-SSA-style starter rows for offline batch builds (no giant raw dump in git).
 * Counts decrease monotonically within each (year, sex) so adapter ranks match national-style order.
 * For production-scale data, point the adapter at official SSA `yob*.txt` (see README).
 */
export type SsaSeedRow = { year: number; name: string; sex: 'M' | 'F'; count: number };

/** Space-separated unique common US boy names (length >= 120). */
const BOY_NAMES =
  'Liam Noah Oliver James Elijah Theodore Henry Lucas William Benjamin Levi Sebastian Jack Ezra Michael Daniel Owen Alexander Mason Ethan Logan Jackson Samuel Jacob Asher Aiden John Joseph Mateo David Wyatt Luke Jayden Carter Julian Grayson Leo Isaac Gabriel Anthony Dylan Lincoln Thomas Maverick Josiah Isaiah Andrew Elias Joshua Nathan Ryan Adrian Christian Miles Colton Cameron Eli Aaron Cooper Jeremiah Easton Jordan Nolan Roman Waylon Axel Brooks Ian Robert Greyson Jameson Leonardo Micah Beau Carson Xavier Jaxon Jace Wesley Hunter Calvin Declan Braxton Emmett Ryder Kayden Silas Bennett Giovanni Vincent Diego Kingston Bentley Ryker Myles Max Amir Finn Rowan Kaiden Damian Graham Tucker Jasper Brandon Kevin Angel Chase Tyler Zion Jason George Legend Jonah Malachi Matteo Hayden Arlo Atlas Adriel Enzo Karter Parker Emiliano Gavin Maxwell Juan Dean Charlie Judah Elliot Emmanuel Felix Rhett Abel Edward August Malcolm Elliott Victor Hayes Jude Archer Beckett Brody Barrett Alex Amari Jesse Tate Messiah Zayn Tristan Kyrie Louis Mark Callum Colt Nico Paul Kenneth Cash Steven Omar Rafael Patrick Peter Maximiliano Simon Walter Javier Kaleb Desmond Holden Knox Kyler Tobias Donald Chance Griffin Kaden Jared Hendrix Bryson Spencer Stephen Zander Erick Mathias Taylor Cade Manuel Finley Andres Cesar Bradley Tanner Phoenix Shane Clayton Zayden Drew Dante Erik Jayce Jett Dallas Prince Collin Ricardo Andy Crew Lukas Ali Garrett River Milo Sean Kameron Warren Jorge Tyson Sergio Johnny Marshall Jaden Kash Sawyer Russell Ronan Reid Lawson Corbin Daxton Cody Andre Harrison Gideon Travis Sterling Lane Baker Kian Derek Romeo';

/** Space-separated unique common US girl names (length >= 120). */
const GIRL_NAMES =
  'Olivia Emma Charlotte Amelia Sophia Isabella Ava Mia Evelyn Luna Harper Camila Sofia Scarlett Elizabeth Eleanor Emily Chloe Mila Violet Penelope Gianna Aria Abigail Ella Avery Hazel Nora Layla Lily Aurora Nova Ellie Madison Grace Willow Zoey Riley Stella Hannah Victoria Natalie Zoe Addison Leah Lucy Ivy Lillian Paisley Everly Anna Caroline Genesis Emilia Kennedy Samantha Maya Kinsley Naomi Aaliyah Elena Sarah Ariana Allison Gabriella Alice Madelyn Cora Ruby Eva Serenity Autumn Adeline Hailey Valentina Isla Eliana Quinn Nevaeh Sadie Piper Lydia Alexa Josephine Emery Julia Delilah Arianna Vivian Kaylee Sophie Brielle Madeline Peyton Rylee Clara Hadley Melanie Juliana Maria Athena Ximena Arya Kylie Taylor Morgan Jade Brooklyn Katherine Faith Mary Jasmine Annabelle Brianna Raelynn Gabriela Cecilia Reagan Valerie Catalina Alina Summer Esther Sienna Margaret Sage Ryleigh Alaia Melody Adalynn Alani Daisy Norah Harmony Amara Kimberly Georgia Alana Lilah Juliette Kendall Rose Elise Adalyn Londyn Payton Arabella Amiyah Mya Brooke Amy Teagan Alaina Gracie Julianna Saylor Presley Adelyn Daniela Jane Mckenzie Izabella Ada Jessica Remi Makenzie Raegan Alivia June Kate Lila Miriam Ember Brynlee Gemma Reese Aniyah Evangeline Juliet Anastasia Finley Lilliana Sloane Diana Noelle Angela Haven Tatum Raven Camille Hayden Blakely Gracelynn Lucille Ruth Marley Kali Mckenna Skylar Daniella Genevieve Amina Jimena Esmeralda Sarai Fatima Laura Mckinley Macy Miracle Joy Lena Amirah Lillie Demi Elaina Kira Scarlet Paris Dahlia Megan Felicity Michaela Priscilla Helen Dakota Rosalie Emberly Bianca Gwendolyn Thea Katalina Dream Journey Alison Phoebe Maddison Sydney Annie Kimora Zuri Milani Joanna Kaia Kaylani Monroe Carmen Oakley Kora Kenia Leighton Sunny Wren Amalia Nyla Sylvia Itzel Yaretzi Allie Kassidy Cassandra Frances Tiffany Arielle Bristol Meredith Mariana Lyric Giuliana Skyler Alondra Lennon';

function splitUnique(raw: string): string[] {
  return raw.split(/\s+/).filter(Boolean);
}

function rowsForYear(year: number, boyOffset: number, girlOffset: number, take: number, countStart: number): SsaSeedRow[] {
  const boys = splitUnique(BOY_NAMES);
  const girls = splitUnique(GIRL_NAMES);
  const b = boys.slice(boyOffset, boyOffset + take);
  const g = girls.slice(girlOffset, girlOffset + take);
  const rows: SsaSeedRow[] = [];
  let c = countStart;
  for (const name of b) {
    rows.push({ year, name, sex: 'M', count: c });
    c -= 19;
  }
  c = countStart;
  for (const name of g) {
    rows.push({ year, name, sex: 'F', count: c });
    c -= 19;
  }
  return rows;
}

/** 2021–2023 × top 100 per sex ≈ 600 deterministic rows (material step up from the 20-line sample). */
export const US_SSA_STARTER_SEED_ROWS: SsaSeedRow[] = [
  ...rowsForYear(2021, 20, 20, 100, 18800),
  ...rowsForYear(2022, 10, 10, 100, 19800),
  ...rowsForYear(2023, 0, 0, 100, 20800),
];
