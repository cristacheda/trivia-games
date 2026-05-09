import type { DifficultyId } from '@/types/game'
import type { SongQuestionSource } from '@/features/guess-the-artist/types'

type SongSeed = Omit<SongQuestionSource, 'weightModifier'>

const songSeeds: SongSeed[] = [
  { id: 'bohemian-rhapsody', songTitle: 'Bohemian Rhapsody', artistName: 'Queen', aliases: ['Queen'], era: '1970s', region: 'Europe', popularityTier: 'popular' },
  { id: 'hotel-california', songTitle: 'Hotel California', artistName: 'Eagles', aliases: ['Eagles'], era: '1970s', region: 'Americas', popularityTier: 'popular' },
  { id: 'smells-like-teen-spirit', songTitle: 'Smells Like Teen Spirit', artistName: 'Nirvana', aliases: ['Nirvana'], era: '1990s', region: 'Americas', popularityTier: 'popular' },
  { id: 'rolling-in-the-deep', songTitle: 'Rolling in the Deep', artistName: 'Adele', aliases: ['Adele'], era: '2010s', region: 'Europe', popularityTier: 'popular' },
  { id: 'shape-of-you', songTitle: 'Shape of You', artistName: 'Ed Sheeran', aliases: ['Ed Sheeran'], era: '2010s', region: 'Europe', popularityTier: 'popular' },
  { id: 'blinding-lights', songTitle: 'Blinding Lights', artistName: 'The Weeknd', aliases: ['The Weeknd', 'Weeknd'], era: '2020s', region: 'Americas', popularityTier: 'popular' },
  { id: 'bad-guy', songTitle: 'bad guy', artistName: 'Billie Eilish', aliases: ['Billie Eilish'], era: '2010s', region: 'Americas', popularityTier: 'popular' },
  { id: 'hips-dont-lie', songTitle: "Hips Don't Lie", artistName: 'Shakira', aliases: ['Shakira'], era: '2000s', region: 'Americas', popularityTier: 'global' },
  { id: 'waka-waka', songTitle: 'Waka Waka (This Time for Africa)', artistName: 'Shakira', aliases: ['Shakira'], era: '2010s', region: 'Americas', popularityTier: 'global' },
  { id: 'despacito', songTitle: 'Despacito', artistName: 'Luis Fonsi', aliases: ['Luis Fonsi', 'Fonsi'], era: '2010s', region: 'Americas', popularityTier: 'global' },
  { id: 'bailando', songTitle: 'Bailando', artistName: 'Enrique Iglesias', aliases: ['Enrique Iglesias'], era: '2010s', region: 'Europe', popularityTier: 'global' },
  { id: 'gangnam-style', songTitle: 'Gangnam Style', artistName: 'PSY', aliases: ['Psy', 'PSY'], era: '2010s', region: 'Asia', popularityTier: 'global' },
  { id: 'dynamite', songTitle: 'Dynamite', artistName: 'BTS', aliases: ['BTS'], era: '2020s', region: 'Asia', popularityTier: 'global' },
  { id: 'how-you-like-that', songTitle: 'How You Like That', artistName: 'BLACKPINK', aliases: ['Blackpink', 'BLACKPINK'], era: '2020s', region: 'Asia', popularityTier: 'global' },
  { id: 'aaj-ki-raat', songTitle: 'Aaj Ki Raat', artistName: 'Madhubanti Bagchi', aliases: ['Madhubanti Bagchi'], era: '2020s', region: 'Asia', popularityTier: 'obscure' },
  { id: 'jai-ho', songTitle: 'Jai Ho', artistName: 'A. R. Rahman', aliases: ['AR Rahman', 'A R Rahman', 'A. R. Rahman'], era: '2000s', region: 'Asia', popularityTier: 'global' },
  { id: 'tum-hi-ho', songTitle: 'Tum Hi Ho', artistName: 'Arijit Singh', aliases: ['Arijit Singh'], era: '2010s', region: 'Asia', popularityTier: 'global' },
  { id: 'faded', songTitle: 'Faded', artistName: 'Alan Walker', aliases: ['Alan Walker'], era: '2010s', region: 'Europe', popularityTier: 'global' },
  { id: 'euphoria', songTitle: 'Euphoria', artistName: 'Loreen', aliases: ['Loreen'], era: '2010s', region: 'Europe', popularityTier: 'global' },
  { id: 'zitti-e-buoni', songTitle: 'Zitti e buoni', artistName: 'Måneskin', aliases: ['Maneskin', 'Måneskin'], era: '2020s', region: 'Europe', popularityTier: 'global' },
  { id: '99-luftballons', songTitle: '99 Luftballons', artistName: 'Nena', aliases: ['Nena'], era: '1980s', region: 'Europe', popularityTier: 'global' },
  { id: 'dragostea-din-tei', songTitle: 'Dragostea Din Tei', artistName: 'O-Zone', aliases: ['O-Zone', 'O Zone'], era: '2000s', region: 'Europe', popularityTier: 'global' },
  { id: 'sodade', songTitle: 'Sodade', artistName: 'Cesária Évora', aliases: ['Cesaria Evora', 'Cesária Évora'], era: '1990s', region: 'Africa', popularityTier: 'obscure' },
  { id: 'jerusalema', songTitle: 'Jerusalema', artistName: 'Master KG', aliases: ['Master KG'], era: '2020s', region: 'Africa', popularityTier: 'global' },
  { id: 'pata-pata', songTitle: 'Pata Pata', artistName: 'Miriam Makeba', aliases: ['Miriam Makeba'], era: '1960s', region: 'Africa', popularityTier: 'global' },
  { id: 'yeke-yeke', songTitle: 'Yeke Yeke', artistName: 'Mory Kanté', aliases: ['Mory Kante', 'Mory Kanté'], era: '1980s', region: 'Africa', popularityTier: 'obscure' },
  { id: 'habibi-ya-nour-el-ain', songTitle: 'Habibi Ya Nour El Ain', artistName: 'Amr Diab', aliases: ['Amr Diab'], era: '1990s', region: 'Africa', popularityTier: 'global' },
  { id: 'tamally-maak', songTitle: 'Tamally Maak', artistName: 'Amr Diab', aliases: ['Amr Diab'], era: '2000s', region: 'Africa', popularityTier: 'global' },
  { id: 'ai-se-eu-te-pego', songTitle: 'Ai Se Eu Te Pego', artistName: 'Michel Teló', aliases: ['Michel Telo', 'Michel Teló'], era: '2010s', region: 'Americas', popularityTier: 'global' },
  { id: 'la-bicicleta', songTitle: 'La Bicicleta', artistName: 'Carlos Vives', aliases: ['Carlos Vives'], era: '2010s', region: 'Americas', popularityTier: 'global' },
  { id: 'calma', songTitle: 'Calma', artistName: 'Pedro Capó', aliases: ['Pedro Capo', 'Pedro Capó'], era: '2010s', region: 'Americas', popularityTier: 'global' },
  { id: 'felices-los-4', songTitle: 'Felices los 4', artistName: 'Maluma', aliases: ['Maluma'], era: '2010s', region: 'Americas', popularityTier: 'global' },
  { id: 'danza-kuduro', songTitle: 'Danza Kuduro', artistName: 'Don Omar', aliases: ['Don Omar'], era: '2010s', region: 'Americas', popularityTier: 'global' },
  { id: 'livin-la-vida-loca', songTitle: "Livin' la Vida Loca", artistName: 'Ricky Martin', aliases: ['Ricky Martin'], era: '1990s', region: 'Americas', popularityTier: 'global' },
  { id: 'gasolina', songTitle: 'Gasolina', artistName: 'Daddy Yankee', aliases: ['Daddy Yankee'], era: '2000s', region: 'Americas', popularityTier: 'global' },
  { id: 'havana', songTitle: 'Havana', artistName: 'Camila Cabello', aliases: ['Camila Cabello'], era: '2010s', region: 'Americas', popularityTier: 'popular' },
  { id: 'september', songTitle: 'September', artistName: 'Earth, Wind & Fire', aliases: ['Earth Wind and Fire', 'Earth Wind & Fire'], era: '1970s', region: 'Americas', popularityTier: 'popular' },
  { id: 'africa', songTitle: 'Africa', artistName: 'Toto', aliases: ['Toto'], era: '1980s', region: 'Americas', popularityTier: 'popular' },
  { id: 'take-on-me', songTitle: 'Take On Me', artistName: 'a-ha', aliases: ['a-ha', 'aha', 'A-ha'], era: '1980s', region: 'Europe', popularityTier: 'popular' },
  { id: 'zombie', songTitle: 'Zombie', artistName: 'The Cranberries', aliases: ['The Cranberries', 'Cranberries'], era: '1990s', region: 'Europe', popularityTier: 'popular' },
  { id: 'somebody-that-i-used-to-know', songTitle: 'Somebody That I Used To Know', artistName: 'Gotye', aliases: ['Gotye'], era: '2010s', region: 'Oceania', popularityTier: 'global' },
  { id: 'dance-monkey', songTitle: 'Dance Monkey', artistName: 'Tones and I', aliases: ['Tones and I'], era: '2020s', region: 'Oceania', popularityTier: 'popular' },
  { id: 'royals', songTitle: 'Royals', artistName: 'Lorde', aliases: ['Lorde'], era: '2010s', region: 'Oceania', popularityTier: 'popular' },
  { id: 'riptide', songTitle: 'Riptide', artistName: 'Vance Joy', aliases: ['Vance Joy'], era: '2010s', region: 'Oceania', popularityTier: 'global' },
  { id: 'conga', songTitle: 'Conga', artistName: 'Gloria Estefan', aliases: ['Gloria Estefan'], era: '1980s', region: 'Americas', popularityTier: 'global' },
  { id: 'lambada', songTitle: 'Lambada', artistName: 'Kaoma', aliases: ['Kaoma'], era: '1980s', region: 'Americas', popularityTier: 'global' },
  { id: 'vamos-a-la-playa', songTitle: 'Vamos a la Playa', artistName: 'Righeira', aliases: ['Righeira'], era: '1980s', region: 'Europe', popularityTier: 'obscure' },
  { id: 'paroles-paroles', songTitle: 'Paroles, paroles', artistName: 'Dalida', aliases: ['Dalida'], era: '1970s', region: 'Europe', popularityTier: 'obscure' },
  { id: 'je-taime-moi-non-plus', songTitle: "Je t'aime... moi non plus", artistName: 'Serge Gainsbourg', aliases: ['Serge Gainsbourg'], era: '1960s', region: 'Europe', popularityTier: 'obscure' },
  { id: 'sukiyaki', songTitle: 'Sukiyaki', artistName: 'Kyu Sakamoto', aliases: ['Kyu Sakamoto'], era: '1960s', region: 'Asia', popularityTier: 'global' },
  { id: 'shinunoga-e-wa', songTitle: 'Shinunoga E-Wa', artistName: 'Fujii Kaze', aliases: ['Fujii Kaze'], era: '2020s', region: 'Asia', popularityTier: 'global' },
  { id: 'night-dancer', songTitle: 'Night Dancer', artistName: 'imase', aliases: ['imase'], era: '2020s', region: 'Asia', popularityTier: 'global' },
  { id: 'believer', songTitle: 'Believer', artistName: 'Imagine Dragons', aliases: ['Imagine Dragons'], era: '2010s', region: 'Americas', popularityTier: 'popular' },
  { id: 'skyfall', songTitle: 'Skyfall', artistName: 'Adele', aliases: ['Adele'], era: '2010s', region: 'Europe', popularityTier: 'popular' },
  { id: 'elastic-heart', songTitle: 'Elastic Heart', artistName: 'Sia', aliases: ['Sia'], era: '2010s', region: 'Oceania', popularityTier: 'global' },
  { id: 'chandelier', songTitle: 'Chandelier', artistName: 'Sia', aliases: ['Sia'], era: '2010s', region: 'Oceania', popularityTier: 'popular' },
  { id: 'heat-waves', songTitle: 'Heat Waves', artistName: 'Glass Animals', aliases: ['Glass Animals'], era: '2020s', region: 'Europe', popularityTier: 'popular' },
  { id: 'pompeii', songTitle: 'Pompeii', artistName: 'Bastille', aliases: ['Bastille'], era: '2010s', region: 'Europe', popularityTier: 'popular' },
  { id: 'stromae-alors-on-danse', songTitle: 'Alors on danse', artistName: 'Stromae', aliases: ['Stromae'], era: '2010s', region: 'Europe', popularityTier: 'global' },
  { id: 'papaoutai', songTitle: 'Papaoutai', artistName: 'Stromae', aliases: ['Stromae'], era: '2010s', region: 'Europe', popularityTier: 'global' },
  { id: 'tornero', songTitle: 'Tornero', artistName: 'Mihai Trăistariu', aliases: ['Mihai Traistariu', 'Mihai Trăistariu'], era: '2000s', region: 'Europe', popularityTier: 'obscure' },
  { id: 'ei-si-ce', songTitle: 'E si ce?', artistName: 'B.U.G. Mafia', aliases: ['B.U.G. Mafia', 'BUG Mafia', 'B U G Mafia'], era: '1990s', region: 'Europe', popularityTier: 'obscure' },
  { id: 'freed-from-desire', songTitle: 'Freed from Desire', artistName: 'Gala', aliases: ['Gala'], era: '1990s', region: 'Europe', popularityTier: 'global' },
  { id: 'blue-da-ba-dee', songTitle: 'Blue (Da Ba Dee)', artistName: 'Eiffel 65', aliases: ['Eiffel 65'], era: '1990s', region: 'Europe', popularityTier: 'global' },
  { id: 'numb', songTitle: 'Numb', artistName: 'Linkin Park', aliases: ['Linkin Park'], era: '2000s', region: 'Americas', popularityTier: 'popular' },
  { id: 'bring-me-to-life', songTitle: 'Bring Me to Life', artistName: 'Evanescence', aliases: ['Evanescence'], era: '2000s', region: 'Americas', popularityTier: 'popular' },
  { id: 'in-the-end', songTitle: 'In the End', artistName: 'Linkin Park', aliases: ['Linkin Park'], era: '2000s', region: 'Americas', popularityTier: 'popular' },
  { id: 'counting-stars', songTitle: 'Counting Stars', artistName: 'OneRepublic', aliases: ['OneRepublic', 'One Republic'], era: '2010s', region: 'Americas', popularityTier: 'popular' },
  { id: 'thrift-shop', songTitle: 'Thrift Shop', artistName: 'Macklemore & Ryan Lewis', aliases: ['Macklemore and Ryan Lewis', 'Macklemore & Ryan Lewis'], era: '2010s', region: 'Americas', popularityTier: 'global' },
  { id: 'lean-on', songTitle: 'Lean On', artistName: 'Major Lazer', aliases: ['Major Lazer'], era: '2010s', region: 'Americas', popularityTier: 'global' },
]

function computeSongSelectionWeight(song: SongSeed, difficultyId: DifficultyId) {
  const baseWeight =
    song.popularityTier === 'popular'
      ? 1.2
      : song.popularityTier === 'global'
        ? 1.6
        : 2

  if (difficultyId === 'level-1') {
    return song.popularityTier === 'popular' ? 2.3 : baseWeight
  }

  if (difficultyId === 'level-2') {
    return baseWeight * (song.popularityTier === 'obscure' ? 1.45 : 1.15)
  }

  return baseWeight * (song.popularityTier === 'obscure' ? 1.8 : 1.3)
}

export const songQuestionBank: SongQuestionSource[] = songSeeds.map((song) => ({
  ...song,
  weightModifier: computeSongSelectionWeight(song, 'level-1'),
}))

export const songQuestionBankById = new Map(
  songQuestionBank.map((song) => [song.id, song]),
)

export function applySongDifficultyWeights(difficultyId: DifficultyId) {
  return songSeeds.map((song) => ({
    ...song,
    weightModifier: computeSongSelectionWeight(song, difficultyId),
  }))
}
