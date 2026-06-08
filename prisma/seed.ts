import { PrismaClient, Role, Position, MatchStatus, EventType, StatCategory, NotificationType, SubscriptionType, Theme, Language } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/-+/g, '-');
}

async function main() {
  console.log('Starting seed...');

  await prisma.$transaction([
    prisma.headToHeadMatch.deleteMany(),
    prisma.headToHead.deleteMany(),
    prisma.commentary.deleteMany(),
    prisma.matchPlayerStat.deleteMany(),
    prisma.matchStatistic.deleteMany(),
    prisma.matchEvent.deleteMany(),
    prisma.standing.deleteMany(),
    prisma.match.deleteMany(),
    prisma.player.deleteMany(),
    prisma.competitionTeam.deleteMany(),
    prisma.team.deleteMany(),
    prisma.season.deleteMany(),
    prisma.competition.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.userSubscription.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.userPreference.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
    prisma.verificationToken.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@futboss.com', name: 'Admin', password: passwordHash, role: Role.ADMIN, emailVerified: new Date() }
  });
  const regularUser = await prisma.user.create({
    data: { email: 'user@futboss.com', name: 'John Doe', password: passwordHash, role: Role.USER, emailVerified: new Date() }
  });
  console.log('Created users');

  const comps: Record<string, string> = {};
  const competitionData = [
    { name: 'UEFA Champions League', shortName: 'UCL', slug: 'uefa-champions-league', country: 'Europe', season: '2025/2026', sportType: 'FOOTBALL', tier: 1 },
    { name: 'Premier League', shortName: 'Premier League', slug: 'premier-league', country: 'England', season: '2025/2026', sportType: 'FOOTBALL', tier: 1 },
    { name: 'La Liga', shortName: 'La Liga', slug: 'la-liga', country: 'Spain', season: '2025/2026', sportType: 'FOOTBALL', tier: 1 },
    { name: 'Serie A', shortName: 'Serie A', slug: 'serie-a', country: 'Italy', season: '2025/2026', sportType: 'FOOTBALL', tier: 1 },
    { name: 'Bundesliga', shortName: 'Bundesliga', slug: 'bundesliga', country: 'Germany', season: '2025/2026', sportType: 'FOOTBALL', tier: 1 },
    { name: 'Ligue 1', shortName: 'Ligue 1', slug: 'ligue-1', country: 'France', season: '2025/2026', sportType: 'FOOTBALL', tier: 1 },
    { name: 'CAF Champions League', shortName: 'CAF CL', slug: 'caf-champions-league', country: 'Africa', season: '2025/2026', sportType: 'FOOTBALL', tier: 2 },
    { name: 'Botola Pro', shortName: 'Botola Pro', slug: 'botola-pro', country: 'Morocco', season: '2025/2026', sportType: 'FOOTBALL', tier: 2 },
    { name: 'FIFA World Cup 2026', shortName: 'WC 2026', slug: 'fifa-world-cup-2026', country: 'International', season: '2026', sportType: 'FOOTBALL', tier: 1 },
    { name: 'International Friendlies', shortName: 'Friendlies', slug: 'international-friendlies', country: 'International', season: '2026', sportType: 'FOOTBALL', tier: 3 },
  ];

  for (const comp of competitionData) {
    const created = await prisma.competition.create({ data: comp });
    comps[comp.name] = created.id;
  }
  console.log('Created competitions');

  const teams: Record<string, string> = {};
  const teamData = [
    { name: 'Real Madrid', shortName: 'Real Madrid', slug: 'real-madrid', country: 'Spain', city: 'Madrid', venue: 'Santiago Bernabéu', foundedYear: 1902, primaryColor: '#FFFFFF', secondaryColor: '#FEBE10' },
    { name: 'FC Barcelona', shortName: 'Barcelona', slug: 'fc-barcelona', country: 'Spain', city: 'Barcelona', venue: 'Camp Nou', foundedYear: 1899, primaryColor: '#A50044', secondaryColor: '#004D98' },
    { name: 'Manchester City', shortName: 'Man City', slug: 'manchester-city', country: 'England', city: 'Manchester', venue: 'Etihad Stadium', foundedYear: 1880, primaryColor: '#6CABDD', secondaryColor: '#FFFFFF' },
    { name: 'Liverpool FC', shortName: 'Liverpool', slug: 'liverpool-fc', country: 'England', city: 'Liverpool', venue: 'Anfield', foundedYear: 1892, primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
    { name: 'Arsenal FC', shortName: 'Arsenal', slug: 'arsenal-fc', country: 'England', city: 'London', venue: 'Emirates Stadium', foundedYear: 1886, primaryColor: '#EF0107', secondaryColor: '#FFFFFF' },
    { name: 'Bayern Munich', shortName: 'Bayern', slug: 'bayern-munich', country: 'Germany', city: 'Munich', venue: 'Allianz Arena', foundedYear: 1900, primaryColor: '#DC052D', secondaryColor: '#0067B1' },
    { name: 'Borussia Dortmund', shortName: 'Dortmund', slug: 'borussia-dortmund', country: 'Germany', city: 'Dortmund', venue: 'Signal Iduna Park', foundedYear: 1909, primaryColor: '#FDE100', secondaryColor: '#000000' },
    { name: 'Inter Milan', shortName: 'Inter', slug: 'inter-milan', country: 'Italy', city: 'Milan', venue: 'San Siro', foundedYear: 1908, primaryColor: '#010E80', secondaryColor: '#000000' },
    { name: 'AC Milan', shortName: 'AC Milan', slug: 'ac-milan', country: 'Italy', city: 'Milan', venue: 'San Siro', foundedYear: 1899, primaryColor: '#FB090B', secondaryColor: '#000000' },
    { name: 'Juventus', shortName: 'Juventus', slug: 'juventus', country: 'Italy', city: 'Turin', venue: 'Allianz Stadium', foundedYear: 1897, primaryColor: '#000000', secondaryColor: '#FFFFFF' },
    { name: 'Paris Saint-Germain', shortName: 'PSG', slug: 'paris-saint-germain', country: 'France', city: 'Paris', venue: 'Parc des Princes', foundedYear: 1970, primaryColor: '#004170', secondaryColor: '#DA291C' },
    { name: 'Olympique Marseille', shortName: 'Marseille', slug: 'olympique-marseille', country: 'France', city: 'Marseille', venue: 'Stade Vélodrome', foundedYear: 1899, primaryColor: '#2FAEE0', secondaryColor: '#FFFFFF' },
    { name: 'Wydad Casablanca', shortName: 'Wydad AC', slug: 'wydad-casablanca', country: 'Morocco', city: 'Casablanca', venue: 'Stade Mohammed V', foundedYear: 1937, primaryColor: '#FF0000', secondaryColor: '#FFFFFF' },
    { name: 'Raja Casablanca', shortName: 'Raja CA', slug: 'raja-casablanca', country: 'Morocco', city: 'Casablanca', venue: 'Stade Mohammed V', foundedYear: 1949, primaryColor: '#008000', secondaryColor: '#FFFFFF' },
    { name: 'Al Ahly SC', shortName: 'Al Ahly', slug: 'al-ahly-sc', country: 'Egypt', city: 'Cairo', venue: 'Cairo International Stadium', foundedYear: 1907, primaryColor: '#FF0000', secondaryColor: '#FFFFFF' },
    { name: 'Zamalek SC', shortName: 'Zamalek', slug: 'zamalek-sc', country: 'Egypt', city: 'Giza', venue: 'Cairo International Stadium', foundedYear: 1911, primaryColor: '#FFFFFF', secondaryColor: '#FF0000' },
    { name: 'Morocco National Team', shortName: 'Morocco', slug: 'morocco-national-team', country: 'Morocco', city: 'Rabat', venue: 'Prince Moulay Abdellah Stadium', foundedYear: 1955, primaryColor: '#C1272D', secondaryColor: '#006233' },
    { name: 'France National Team', shortName: 'France', slug: 'france-national-team', country: 'France', city: 'Paris', venue: 'Stade de France', foundedYear: 1904, primaryColor: '#002395', secondaryColor: '#FFFFFF' },
    { name: 'Brazil National Team', shortName: 'Brazil', slug: 'brazil-national-team', country: 'Brazil', city: 'Rio de Janeiro', venue: 'Maracanã', foundedYear: 1914, primaryColor: '#F7C129', secondaryColor: '#009739' },
    { name: 'Argentina National Team', shortName: 'Argentina', slug: 'argentina-national-team', country: 'Argentina', city: 'Buenos Aires', venue: 'Estadio Monumental', foundedYear: 1893, primaryColor: '#75AADB', secondaryColor: '#FFFFFF' },
  ];

  for (const t of teamData) {
    const created = await prisma.team.create({ data: t });
    teams[t.name] = created.id;
  }
  console.log('Created teams');

  const compTeamLinks: Array<[string, string]> = [
    ['UEFA Champions League', 'Real Madrid'], ['UEFA Champions League', 'FC Barcelona'],
    ['UEFA Champions League', 'Manchester City'], ['UEFA Champions League', 'Liverpool FC'],
    ['UEFA Champions League', 'Arsenal FC'], ['UEFA Champions League', 'Bayern Munich'],
    ['UEFA Champions League', 'Borussia Dortmund'], ['UEFA Champions League', 'Inter Milan'],
    ['UEFA Champions League', 'AC Milan'], ['UEFA Champions League', 'Juventus'],
    ['UEFA Champions League', 'Paris Saint-Germain'], ['UEFA Champions League', 'Olympique Marseille'],
    ['Premier League', 'Manchester City'], ['Premier League', 'Liverpool FC'], ['Premier League', 'Arsenal FC'],
    ['La Liga', 'Real Madrid'], ['La Liga', 'FC Barcelona'],
    ['Serie A', 'Inter Milan'], ['Serie A', 'AC Milan'], ['Serie A', 'Juventus'],
    ['Bundesliga', 'Bayern Munich'], ['Bundesliga', 'Borussia Dortmund'],
    ['Ligue 1', 'Paris Saint-Germain'], ['Ligue 1', 'Olympique Marseille'],
    ['Botola Pro', 'Wydad Casablanca'], ['Botola Pro', 'Raja Casablanca'],
    ['CAF Champions League', 'Wydad Casablanca'], ['CAF Champions League', 'Al Ahly SC'], ['CAF Champions League', 'Zamalek SC'],
    ['FIFA World Cup 2026', 'Morocco National Team'], ['FIFA World Cup 2026', 'France National Team'],
    ['FIFA World Cup 2026', 'Brazil National Team'], ['FIFA World Cup 2026', 'Argentina National Team'],
    ['International Friendlies', 'Morocco National Team'], ['International Friendlies', 'France National Team'],
    ['International Friendlies', 'Brazil National Team'], ['International Friendlies', 'Argentina National Team'],
  ];

  for (const link of compTeamLinks) {
    const [compName, teamName] = link;
    await prisma.competitionTeam.create({
      data: { competitionId: comps[compName]!, teamId: teams[teamName]! }
    });
  }
  console.log('Created competition-team links');

  const players: Record<string, string> = {};
  const playerData: Array<{
    name: string; team: string; position: Position; nationality: string; age: number;
    shirtNumber: number; height: number; weight: number; preferredFoot: string;
    marketValue: number; goals: number; assists: number; appearances: number; rating: number
  }> = [
    { name: 'Thibaut Courtois', team: 'Real Madrid', position: Position.GK, nationality: 'Belgium', age: 32, shirtNumber: 1, height: 200, weight: 96, preferredFoot: 'Left', marketValue: 35, goals: 0, assists: 0, appearances: 280, rating: 7.4 },
    { name: 'Antonio Rüdiger', team: 'Real Madrid', position: Position.CB, nationality: 'Germany', age: 31, shirtNumber: 22, height: 190, weight: 85, preferredFoot: 'Right', marketValue: 25, goals: 8, assists: 3, appearances: 320, rating: 7.0 },
    { name: 'Éder Militão', team: 'Real Madrid', position: Position.CB, nationality: 'Brazil', age: 26, shirtNumber: 3, height: 186, weight: 78, preferredFoot: 'Right', marketValue: 60, goals: 6, assists: 2, appearances: 200, rating: 7.1 },
    { name: 'Jude Bellingham', team: 'Real Madrid', position: Position.CM, nationality: 'England', age: 21, shirtNumber: 5, height: 186, weight: 75, preferredFoot: 'Right', marketValue: 180, goals: 42, assists: 28, appearances: 180, rating: 7.6 },
    { name: 'Vinícius Júnior', team: 'Real Madrid', position: Position.LW, nationality: 'Brazil', age: 24, shirtNumber: 7, height: 176, weight: 70, preferredFoot: 'Right', marketValue: 200, goals: 85, assists: 65, appearances: 290, rating: 7.5 },
    { name: 'Kylian Mbappé', team: 'Real Madrid', position: Position.ST, nationality: 'France', age: 25, shirtNumber: 9, height: 178, weight: 75, preferredFoot: 'Right', marketValue: 180, goals: 210, assists: 95, appearances: 350, rating: 7.8 },
    { name: 'Marc-André ter Stegen', team: 'FC Barcelona', position: Position.GK, nationality: 'Germany', age: 32, shirtNumber: 1, height: 187, weight: 85, preferredFoot: 'Right', marketValue: 15, goals: 0, assists: 0, appearances: 380, rating: 7.2 },
    { name: 'Ronald Araújo', team: 'FC Barcelona', position: Position.CB, nationality: 'Uruguay', age: 25, shirtNumber: 4, height: 188, weight: 80, preferredFoot: 'Right', marketValue: 70, goals: 8, assists: 2, appearances: 190, rating: 7.1 },
    { name: 'Pedri', team: 'FC Barcelona', position: Position.CM, nationality: 'Spain', age: 21, shirtNumber: 8, height: 174, weight: 65, preferredFoot: 'Right', marketValue: 150, goals: 18, assists: 25, appearances: 175, rating: 7.4 },
    { name: 'Gavi', team: 'FC Barcelona', position: Position.CM, nationality: 'Spain', age: 20, shirtNumber: 6, height: 173, weight: 70, preferredFoot: 'Right', marketValue: 140, goals: 10, assists: 15, appearances: 155, rating: 7.2 },
    { name: 'Lamine Yamal', team: 'FC Barcelona', position: Position.RW, nationality: 'Spain', age: 17, shirtNumber: 19, height: 178, weight: 65, preferredFoot: 'Left', marketValue: 120, goals: 12, assists: 18, appearances: 60, rating: 7.5 },
    { name: 'Robert Lewandowski', team: 'FC Barcelona', position: Position.ST, nationality: 'Poland', age: 35, shirtNumber: 9, height: 185, weight: 81, preferredFoot: 'Right', marketValue: 30, goals: 350, assists: 120, appearances: 550, rating: 7.7 },
    { name: 'Erling Haaland', team: 'Manchester City', position: Position.ST, nationality: 'Norway', age: 24, shirtNumber: 9, height: 194, weight: 88, preferredFoot: 'Left', marketValue: 200, goals: 160, assists: 40, appearances: 200, rating: 7.9 },
    { name: 'Kevin De Bruyne', team: 'Manchester City', position: Position.CAM, nationality: 'Belgium', age: 33, shirtNumber: 17, height: 181, weight: 76, preferredFoot: 'Right', marketValue: 50, goals: 95, assists: 150, appearances: 380, rating: 7.6 },
    { name: 'Phil Foden', team: 'Manchester City', position: Position.RW, nationality: 'England', age: 24, shirtNumber: 47, height: 171, weight: 70, preferredFoot: 'Left', marketValue: 130, goals: 60, assists: 45, appearances: 220, rating: 7.3 },
    { name: 'Rodri', team: 'Manchester City', position: Position.CDM, nationality: 'Spain', age: 28, shirtNumber: 16, height: 190, weight: 82, preferredFoot: 'Right', marketValue: 120, goals: 20, assists: 18, appearances: 280, rating: 7.5 },
    { name: 'Ruben Dias', team: 'Manchester City', position: Position.CB, nationality: 'Portugal', age: 27, shirtNumber: 3, height: 187, weight: 84, preferredFoot: 'Right', marketValue: 80, goals: 5, assists: 2, appearances: 250, rating: 7.3 },
    { name: 'Mohamed Salah', team: 'Liverpool FC', position: Position.RW, nationality: 'Egypt', age: 32, shirtNumber: 11, height: 175, weight: 71, preferredFoot: 'Left', marketValue: 60, goals: 200, assists: 85, appearances: 400, rating: 7.6 },
    { name: 'Virgil van Dijk', team: 'Liverpool FC', position: Position.CB, nationality: 'Netherlands', age: 33, shirtNumber: 4, height: 195, weight: 92, preferredFoot: 'Right', marketValue: 30, goals: 25, assists: 8, appearances: 350, rating: 7.3 },
    { name: 'Trent Alexander-Arnold', team: 'Liverpool FC', position: Position.RB, nationality: 'England', age: 25, shirtNumber: 66, height: 175, weight: 69, preferredFoot: 'Right', marketValue: 70, goals: 18, assists: 65, appearances: 280, rating: 7.2 },
    { name: 'Alexis Mac Allister', team: 'Liverpool FC', position: Position.CM, nationality: 'Argentina', age: 25, shirtNumber: 10, height: 176, weight: 72, preferredFoot: 'Right', marketValue: 75, goals: 30, assists: 28, appearances: 200, rating: 7.1 },
    { name: 'Bukayo Saka', team: 'Arsenal FC', position: Position.RW, nationality: 'England', age: 23, shirtNumber: 7, height: 178, weight: 72, preferredFoot: 'Left', marketValue: 120, goals: 48, assists: 40, appearances: 200, rating: 7.4 },
    { name: 'Martin Ødegaard', team: 'Arsenal FC', position: Position.CAM, nationality: 'Norway', age: 25, shirtNumber: 8, height: 178, weight: 74, preferredFoot: 'Left', marketValue: 100, goals: 35, assists: 38, appearances: 220, rating: 7.3 },
    { name: 'Declan Rice', team: 'Arsenal FC', position: Position.CDM, nationality: 'England', age: 25, shirtNumber: 41, height: 185, weight: 80, preferredFoot: 'Right', marketValue: 110, goals: 15, assists: 20, appearances: 250, rating: 7.2 },
    { name: 'Harry Kane', team: 'Bayern Munich', position: Position.ST, nationality: 'England', age: 31, shirtNumber: 9, height: 188, weight: 89, preferredFoot: 'Right', marketValue: 110, goals: 280, assists: 90, appearances: 450, rating: 7.7 },
    { name: 'Jamal Musiala', team: 'Bayern Munich', position: Position.CAM, nationality: 'Germany', age: 21, shirtNumber: 42, height: 184, weight: 72, preferredFoot: 'Right', marketValue: 130, goals: 35, assists: 30, appearances: 170, rating: 7.4 },
    { name: 'Joshua Kimmich', team: 'Bayern Munich', position: Position.CDM, nationality: 'Germany', age: 29, shirtNumber: 6, height: 176, weight: 75, preferredFoot: 'Right', marketValue: 60, goals: 30, assists: 55, appearances: 350, rating: 7.3 },
    { name: 'Leroy Sané', team: 'Bayern Munich', position: Position.RW, nationality: 'Germany', age: 28, shirtNumber: 10, height: 183, weight: 77, preferredFoot: 'Left', marketValue: 60, goals: 85, assists: 60, appearances: 320, rating: 7.2 },
    { name: 'Karim Adeyemi', team: 'Borussia Dortmund', position: Position.ST, nationality: 'Germany', age: 22, shirtNumber: 27, height: 178, weight: 75, preferredFoot: 'Right', marketValue: 35, goals: 28, assists: 15, appearances: 120, rating: 7.0 },
    { name: 'Nico Schlotterbeck', team: 'Borussia Dortmund', position: Position.CB, nationality: 'Germany', age: 24, shirtNumber: 4, height: 191, weight: 86, preferredFoot: 'Left', marketValue: 50, goals: 8, assists: 5, appearances: 140, rating: 7.1 },
    { name: 'Julian Brandt', team: 'Borussia Dortmund', position: Position.CAM, nationality: 'Germany', age: 28, shirtNumber: 10, height: 183, weight: 79, preferredFoot: 'Right', marketValue: 30, goals: 45, assists: 50, appearances: 300, rating: 7.1 },
    { name: 'Lautaro Martínez', team: 'Inter Milan', position: Position.ST, nationality: 'Argentina', age: 27, shirtNumber: 10, height: 174, weight: 72, preferredFoot: 'Right', marketValue: 100, goals: 112, assists: 40, appearances: 280, rating: 7.4 },
    { name: 'Nicolò Barella', team: 'Inter Milan', position: Position.CM, nationality: 'Italy', age: 27, shirtNumber: 23, height: 175, weight: 75, preferredFoot: 'Right', marketValue: 80, goals: 22, assists: 35, appearances: 270, rating: 7.3 },
    { name: 'Alessandro Bastoni', team: 'Inter Milan', position: Position.CB, nationality: 'Italy', age: 25, shirtNumber: 95, height: 190, weight: 80, preferredFoot: 'Left', marketValue: 75, goals: 5, assists: 8, appearances: 190, rating: 7.1 },
    { name: 'Hakan Calhanoglu', team: 'Inter Milan', position: Position.CDM, nationality: 'Turkey', age: 30, shirtNumber: 20, height: 178, weight: 76, preferredFoot: 'Right', marketValue: 40, goals: 35, assists: 45, appearances: 350, rating: 7.2 },
    { name: 'Rafael Leão', team: 'AC Milan', position: Position.LW, nationality: 'Portugal', age: 25, shirtNumber: 10, height: 188, weight: 81, preferredFoot: 'Right', marketValue: 100, goals: 55, assists: 40, appearances: 210, rating: 7.3 },
    { name: 'Theo Hernández', team: 'AC Milan', position: Position.LB, nationality: 'France', age: 26, shirtNumber: 19, height: 181, weight: 78, preferredFoot: 'Left', marketValue: 60, goals: 28, assists: 35, appearances: 250, rating: 7.2 },
    { name: 'Mike Maignan', team: 'AC Milan', position: Position.GK, nationality: 'France', age: 29, shirtNumber: 16, height: 191, weight: 89, preferredFoot: 'Right', marketValue: 45, goals: 0, assists: 0, appearances: 230, rating: 7.0 },
    { name: 'Dušan Vlahović', team: 'Juventus', position: Position.ST, nationality: 'Serbia', age: 24, shirtNumber: 9, height: 190, weight: 80, preferredFoot: 'Left', marketValue: 65, goals: 72, assists: 18, appearances: 200, rating: 7.1 },
    { name: 'Federico Chiesa', team: 'Juventus', position: Position.LW, nationality: 'Italy', age: 26, shirtNumber: 7, height: 175, weight: 70, preferredFoot: 'Right', marketValue: 50, goals: 45, assists: 30, appearances: 210, rating: 7.1 },
    { name: 'Manuel Locatelli', team: 'Juventus', position: Position.CM, nationality: 'Italy', age: 26, shirtNumber: 5, height: 186, weight: 77, preferredFoot: 'Right', marketValue: 30, goals: 12, assists: 15, appearances: 220, rating: 6.9 },
    { name: 'Ousmane Dembélé', team: 'Paris Saint-Germain', position: Position.RW, nationality: 'France', age: 27, shirtNumber: 10, height: 178, weight: 68, preferredFoot: 'Both', marketValue: 60, goals: 55, assists: 65, appearances: 280, rating: 7.1 },
    { name: 'Achraf Hakimi', team: 'Paris Saint-Germain', position: Position.RB, nationality: 'Morocco', age: 25, shirtNumber: 2, height: 181, weight: 78, preferredFoot: 'Right', marketValue: 60, goals: 25, assists: 40, appearances: 280, rating: 7.3 },
    { name: 'Gianluigi Donnarumma', team: 'Paris Saint-Germain', position: Position.GK, nationality: 'Italy', age: 25, shirtNumber: 99, height: 196, weight: 98, preferredFoot: 'Right', marketValue: 45, goals: 0, assists: 0, appearances: 300, rating: 7.1 },
    { name: 'Pierre-Emerick Aubameyang', team: 'Olympique Marseille', position: Position.ST, nationality: 'Gabon', age: 35, shirtNumber: 10, height: 187, weight: 80, preferredFoot: 'Right', marketValue: 5, goals: 280, assists: 70, appearances: 500, rating: 7.3 },
    { name: 'Amine Harit', team: 'Olympique Marseille', position: Position.CAM, nationality: 'Morocco', age: 27, shirtNumber: 11, height: 180, weight: 72, preferredFoot: 'Right', marketValue: 15, goals: 30, assists: 40, appearances: 200, rating: 7.0 },
    { name: 'Yahya Jabrane', team: 'Wydad Casablanca', position: Position.CM, nationality: 'Morocco', age: 33, shirtNumber: 5, height: 183, weight: 78, preferredFoot: 'Right', marketValue: 1, goals: 15, assists: 20, appearances: 280, rating: 6.8 },
    { name: 'Mouad Madani', team: 'Wydad Casablanca', position: Position.ST, nationality: 'Morocco', age: 26, shirtNumber: 9, height: 180, weight: 76, preferredFoot: 'Right', marketValue: 2, goals: 40, assists: 15, appearances: 150, rating: 6.9 },
    { name: 'Mohamed Zrida', team: 'Raja Casablanca', position: Position.CM, nationality: 'Morocco', age: 25, shirtNumber: 18, height: 177, weight: 72, preferredFoot: 'Right', marketValue: 1.5, goals: 12, assists: 18, appearances: 120, rating: 6.9 },
    { name: 'Yousri Bouzok', team: 'Raja Casablanca', position: Position.LW, nationality: 'Morocco', age: 27, shirtNumber: 11, height: 173, weight: 68, preferredFoot: 'Right', marketValue: 1.2, goals: 35, assists: 25, appearances: 140, rating: 7.0 },
    { name: 'Mohamed El Shenawy', team: 'Al Ahly SC', position: Position.GK, nationality: 'Egypt', age: 35, shirtNumber: 1, height: 191, weight: 85, preferredFoot: 'Right', marketValue: 1.5, goals: 0, assists: 0, appearances: 300, rating: 7.1 },
    { name: 'Percy Tau', team: 'Al Ahly SC', position: Position.LW, nationality: 'South Africa', age: 30, shirtNumber: 10, height: 175, weight: 70, preferredFoot: 'Right', marketValue: 2, goals: 50, assists: 35, appearances: 200, rating: 7.0 },
    { name: 'Hussein El Shahat', team: 'Al Ahly SC', position: Position.RW, nationality: 'Egypt', age: 32, shirtNumber: 7, height: 171, weight: 72, preferredFoot: 'Left', marketValue: 1.2, goals: 35, assists: 30, appearances: 180, rating: 7.0 },
    { name: 'Shikabala', team: 'Zamalek SC', position: Position.LW, nationality: 'Egypt', age: 38, shirtNumber: 10, height: 183, weight: 78, preferredFoot: 'Right', marketValue: 0.5, goals: 90, assists: 60, appearances: 400, rating: 6.8 },
    { name: 'Nasser Maher', team: 'Zamalek SC', position: Position.CAM, nationality: 'Egypt', age: 27, shirtNumber: 22, height: 175, weight: 70, preferredFoot: 'Right', marketValue: 1, goals: 20, assists: 25, appearances: 150, rating: 6.9 },
    { name: 'Yassine Bounou', team: 'Morocco National Team', position: Position.GK, nationality: 'Morocco', age: 33, shirtNumber: 1, height: 195, weight: 88, preferredFoot: 'Right', marketValue: 10, goals: 0, assists: 0, appearances: 60, rating: 7.2 },
    { name: 'Sofyan Amrabat', team: 'Morocco National Team', position: Position.CDM, nationality: 'Morocco', age: 28, shirtNumber: 4, height: 185, weight: 80, preferredFoot: 'Right', marketValue: 25, goals: 5, assists: 8, appearances: 55, rating: 7.0 },
    { name: 'Hakim Ziyech', team: 'Morocco National Team', position: Position.RW, nationality: 'Morocco', age: 31, shirtNumber: 7, height: 180, weight: 75, preferredFoot: 'Left', marketValue: 10, goals: 20, assists: 25, appearances: 60, rating: 7.2 },
    { name: 'Youssef En-Nesyri', team: 'Morocco National Team', position: Position.ST, nationality: 'Morocco', age: 27, shirtNumber: 19, height: 192, weight: 80, preferredFoot: 'Right', marketValue: 20, goals: 40, assists: 10, appearances: 70, rating: 7.0 },
    { name: 'Noussair Mazraoui', team: 'Morocco National Team', position: Position.RB, nationality: 'Morocco', age: 26, shirtNumber: 3, height: 183, weight: 76, preferredFoot: 'Right', marketValue: 25, goals: 5, assists: 12, appearances: 40, rating: 7.0 },
    { name: 'Antoine Griezmann', team: 'France National Team', position: Position.CAM, nationality: 'France', age: 33, shirtNumber: 7, height: 175, weight: 73, preferredFoot: 'Left', marketValue: 30, goals: 120, assists: 65, appearances: 500, rating: 7.5 },
    { name: 'Aurélien Tchouaméni', team: 'France National Team', position: Position.CDM, nationality: 'France', age: 24, shirtNumber: 8, height: 187, weight: 82, preferredFoot: 'Right', marketValue: 100, goals: 8, assists: 6, appearances: 180, rating: 7.1 },
    { name: 'Dayot Upamecano', team: 'France National Team', position: Position.CB, nationality: 'France', age: 25, shirtNumber: 4, height: 186, weight: 85, preferredFoot: 'Right', marketValue: 50, goals: 5, assists: 3, appearances: 180, rating: 7.0 },
    { name: 'Alisson Becker', team: 'Brazil National Team', position: Position.GK, nationality: 'Brazil', age: 31, shirtNumber: 1, height: 191, weight: 91, preferredFoot: 'Right', marketValue: 35, goals: 0, assists: 0, appearances: 350, rating: 7.3 },
    { name: 'Marquinhos', team: 'Brazil National Team', position: Position.CB, nationality: 'Brazil', age: 30, shirtNumber: 4, height: 183, weight: 79, preferredFoot: 'Right', marketValue: 35, goals: 15, assists: 5, appearances: 350, rating: 7.1 },
    { name: 'Rodrygo', team: 'Brazil National Team', position: Position.RW, nationality: 'Brazil', age: 23, shirtNumber: 11, height: 174, weight: 68, preferredFoot: 'Right', marketValue: 110, goals: 38, assists: 28, appearances: 180, rating: 7.3 },
    { name: 'Lionel Messi', team: 'Argentina National Team', position: Position.RW, nationality: 'Argentina', age: 37, shirtNumber: 10, height: 170, weight: 67, preferredFoot: 'Left', marketValue: 30, goals: 650, assists: 300, appearances: 800, rating: 8.0 },
    { name: 'Julián Álvarez', team: 'Argentina National Team', position: Position.ST, nationality: 'Argentina', age: 24, shirtNumber: 9, height: 170, weight: 71, preferredFoot: 'Right', marketValue: 90, goals: 55, assists: 28, appearances: 200, rating: 7.2 },
    { name: 'Cristian Romero', team: 'Argentina National Team', position: Position.CB, nationality: 'Argentina', age: 26, shirtNumber: 13, height: 186, weight: 83, preferredFoot: 'Right', marketValue: 65, goals: 5, assists: 2, appearances: 150, rating: 7.1 },
    { name: 'Enzo Fernández', team: 'Argentina National Team', position: Position.CM, nationality: 'Argentina', age: 23, shirtNumber: 24, height: 178, weight: 78, preferredFoot: 'Right', marketValue: 80, goals: 12, assists: 18, appearances: 120, rating: 7.2 },
  ];

  for (const p of playerData) {
    const created = await prisma.player.create({
      data: {
        name: p.name,
        slug: slugify(p.name),
        age: p.age,
        nationality: p.nationality,
        position: p.position,
        shirtNumber: p.shirtNumber,
        height: p.height,
        weight: p.weight,
        preferredFoot: p.preferredFoot,
        marketValue: p.marketValue,
        goals: p.goals,
        assists: p.assists,
        appearances: p.appearances,
        rating: p.rating,
        teamId: teams[p.team]!
      }
    });
    players[p.name] = created.id;
  }
  console.log(`Created ${Object.keys(players).length} players`);

  const matches: Record<string, string> = {};
  const matchData: Array<{
    key: string; competition: string; homeTeam: string; awayTeam: string;
    homeScore: number | null; awayScore: number | null; status: MatchStatus;
    minute: number; round: string; date: Date; venue: string; referee: string; attendance: number
  }> = [
    { key: 'ucl-qf1', competition: 'UEFA Champions League', homeTeam: 'Real Madrid', awayTeam: 'Bayern Munich', homeScore: 2, awayScore: 1, status: MatchStatus.FINISHED, minute: 90, round: 'Quarter Final 1st Leg', date: new Date('2026-04-08T20:00:00Z'), venue: 'Santiago Bernabéu', referee: 'Szymon Marciniak', attendance: 81000 },
    { key: 'ucl-qf2', competition: 'UEFA Champions League', homeTeam: 'Bayern Munich', awayTeam: 'Real Madrid', homeScore: 1, awayScore: 1, status: MatchStatus.FINISHED, minute: 90, round: 'Quarter Final 2nd Leg', date: new Date('2026-04-15T20:00:00Z'), venue: 'Allianz Arena', referee: 'Daniele Orsato', attendance: 75000 },
    { key: 'ucl-final', competition: 'UEFA Champions League', homeTeam: 'Manchester City', awayTeam: 'Inter Milan', homeScore: 1, awayScore: 0, status: MatchStatus.FINISHED, minute: 90, round: 'Final', date: new Date('2026-05-31T20:00:00Z'), venue: 'Wembley Stadium', referee: 'Clement Turpin', attendance: 90000 },
    { key: 'ucl-gs1', competition: 'UEFA Champions League', homeTeam: 'FC Barcelona', awayTeam: 'Paris Saint-Germain', homeScore: 3, awayScore: 2, status: MatchStatus.FINISHED, minute: 90, round: 'Group Stage', date: new Date('2025-09-16T20:00:00Z'), venue: 'Camp Nou', referee: 'Michael Oliver', attendance: 95000 },
    { key: 'ucl-gs2', competition: 'UEFA Champions League', homeTeam: 'Real Madrid', awayTeam: 'Manchester City', homeScore: 0, awayScore: 0, status: MatchStatus.HALF_TIME, minute: 45, round: 'Semi Final 1st Leg', date: new Date('2026-06-08T20:00:00Z'), venue: 'Santiago Bernabéu', referee: 'Felix Zwayer', attendance: 82000 },
    { key: 'ucl-gs3', competition: 'UEFA Champions League', homeTeam: 'Liverpool FC', awayTeam: 'AC Milan', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Group Stage', date: new Date('2026-09-15T20:00:00Z'), venue: 'Anfield', referee: '', attendance: 0 },
    { key: 'ucl-gs4', competition: 'UEFA Champions League', homeTeam: 'Borussia Dortmund', awayTeam: 'Juventus', homeScore: 1, awayScore: 1, status: MatchStatus.LIVE, minute: 72, round: 'Group Stage', date: new Date('2026-06-08T20:00:00Z'), venue: 'Signal Iduna Park', referee: 'Slavko Vinčić', attendance: 66000 },
    { key: 'ucl-gs5', competition: 'UEFA Champions League', homeTeam: 'Paris Saint-Germain', awayTeam: 'FC Barcelona', homeScore: 1, awayScore: 1, status: MatchStatus.FINISHED, minute: 90, round: 'Group Stage', date: new Date('2025-11-05T20:00:00Z'), venue: 'Parc des Princes', referee: 'Danny Makkelie', attendance: 48000 },
    { key: 'ucl-gs6', competition: 'UEFA Champions League', homeTeam: 'Inter Milan', awayTeam: 'Arsenal FC', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Group Stage', date: new Date('2026-10-20T20:00:00Z'), venue: 'San Siro', referee: '', attendance: 0 },
    { key: 'epl1', competition: 'Premier League', homeTeam: 'Manchester City', awayTeam: 'Liverpool FC', homeScore: 2, awayScore: 2, status: MatchStatus.FINISHED, minute: 90, round: 'Matchday 32', date: new Date('2026-03-10T16:00:00Z'), venue: 'Etihad Stadium', referee: 'Anthony Taylor', attendance: 55000 },
    { key: 'epl2', competition: 'Premier League', homeTeam: 'Arsenal FC', awayTeam: 'Manchester City', homeScore: 1, awayScore: 3, status: MatchStatus.FINISHED, minute: 90, round: 'Matchday 34', date: new Date('2026-04-22T16:00:00Z'), venue: 'Emirates Stadium', referee: 'Michael Oliver', attendance: 60200 },
    { key: 'epl3', competition: 'Premier League', homeTeam: 'Liverpool FC', awayTeam: 'Arsenal FC', homeScore: 0, awayScore: 0, status: MatchStatus.LIVE, minute: 35, round: 'Matchday 37', date: new Date('2026-06-08T16:00:00Z'), venue: 'Anfield', referee: 'Paul Tierney', attendance: 53300 },
    { key: 'epl4', competition: 'Premier League', homeTeam: 'Manchester City', awayTeam: 'Arsenal FC', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Matchday 38', date: new Date('2026-08-16T16:00:00Z'), venue: 'Etihad Stadium', referee: '', attendance: 0 },
    { key: 'epl5', competition: 'Premier League', homeTeam: 'Liverpool FC', awayTeam: 'Manchester City', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Matchday 1', date: new Date('2026-08-23T16:00:00Z'), venue: 'Anfield', referee: '', attendance: 0 },
    { key: 'laliga1', competition: 'La Liga', homeTeam: 'Real Madrid', awayTeam: 'FC Barcelona', homeScore: 2, awayScore: 0, status: MatchStatus.FINISHED, minute: 90, round: 'Matchday 26', date: new Date('2026-03-02T20:00:00Z'), venue: 'Santiago Bernabéu', referee: 'José María Sánchez', attendance: 82000 },
    { key: 'laliga2', competition: 'La Liga', homeTeam: 'FC Barcelona', awayTeam: 'Real Madrid', homeScore: null, awayScore: null, status: MatchStatus.POSTPONED, minute: 0, round: 'Matchday 32', date: new Date('2026-05-10T20:00:00Z'), venue: 'Camp Nou', referee: '', attendance: 0 },
    { key: 'laliga3', competition: 'La Liga', homeTeam: 'Real Madrid', awayTeam: 'FC Barcelona', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Copa del Rey Final', date: new Date('2026-08-30T20:00:00Z'), venue: 'Estadio de La Cartuja', referee: '', attendance: 0 },
    { key: 'bundes1', competition: 'Bundesliga', homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund', homeScore: 3, awayScore: 0, status: MatchStatus.FINISHED, minute: 90, round: 'Der Klassiker', date: new Date('2026-04-05T17:30:00Z'), venue: 'Allianz Arena', referee: 'Daniel Siebert', attendance: 75000 },
    { key: 'bundes2', competition: 'Bundesliga', homeTeam: 'Borussia Dortmund', awayTeam: 'Bayern Munich', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Der Klassiker', date: new Date('2026-09-20T17:30:00Z'), venue: 'Signal Iduna Park', referee: '', attendance: 0 },
    { key: 'bundes3', competition: 'Bundesliga', homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund', homeScore: 4, awayScore: 2, status: MatchStatus.FINISHED, minute: 90, round: 'Matchday 15', date: new Date('2025-12-06T17:30:00Z'), venue: 'Allianz Arena', referee: 'Felix Zwayer', attendance: 75000 },
    { key: 'seriea1', competition: 'Serie A', homeTeam: 'Inter Milan', awayTeam: 'AC Milan', homeScore: 2, awayScore: 1, status: MatchStatus.FINISHED, minute: 90, round: 'Derby della Madonnina', date: new Date('2026-02-22T20:00:00Z'), venue: 'San Siro', referee: 'Daniele Doveri', attendance: 76000 },
    { key: 'seriea2', competition: 'Serie A', homeTeam: 'AC Milan', awayTeam: 'Juventus', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Matchday 36', date: new Date('2026-07-12T20:00:00Z'), venue: 'San Siro', referee: '', attendance: 0 },
    { key: 'seriea3', competition: 'Serie A', homeTeam: 'Juventus', awayTeam: 'Inter Milan', homeScore: 1, awayScore: 0, status: MatchStatus.LIVE, minute: 65, round: 'Derby d\'Italia', date: new Date('2026-06-08T20:00:00Z'), venue: 'Allianz Stadium', referee: 'Marco Guida', attendance: 41000 },
    { key: 'ligue1-1', competition: 'Ligue 1', homeTeam: 'Paris Saint-Germain', awayTeam: 'Olympique Marseille', homeScore: 3, awayScore: 1, status: MatchStatus.FINISHED, minute: 90, round: 'Le Classique', date: new Date('2026-03-30T20:00:00Z'), venue: 'Parc des Princes', referee: 'Benoît Bastien', attendance: 48000 },
    { key: 'ligue1-2', competition: 'Ligue 1', homeTeam: 'Olympique Marseille', awayTeam: 'Paris Saint-Germain', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Le Classique', date: new Date('2026-09-13T20:00:00Z'), venue: 'Stade Vélodrome', referee: '', attendance: 0 },
    { key: 'ligue1-3', competition: 'Ligue 1', homeTeam: 'Paris Saint-Germain', awayTeam: 'Olympique Marseille', homeScore: 2, awayScore: 0, status: MatchStatus.FINISHED, minute: 90, round: 'Matchday 10', date: new Date('2025-10-19T20:00:00Z'), venue: 'Parc des Princes', referee: 'François Letexier', attendance: 47000 },
    { key: 'botola1', competition: 'Botola Pro', homeTeam: 'Wydad Casablanca', awayTeam: 'Raja Casablanca', homeScore: 1, awayScore: 1, status: MatchStatus.LIVE, minute: 55, round: 'Casablanca Derby', date: new Date('2026-06-08T18:00:00Z'), venue: 'Stade Mohammed V', referee: 'Redouane Jiyed', attendance: 65000 },
    { key: 'botola2', competition: 'Botola Pro', homeTeam: 'Raja Casablanca', awayTeam: 'Wydad Casablanca', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Casablanca Derby', date: new Date('2026-08-10T18:00:00Z'), venue: 'Stade Mohammed V', referee: '', attendance: 0 },
    { key: 'botola3', competition: 'Botola Pro', homeTeam: 'Wydad Casablanca', awayTeam: 'Raja Casablanca', homeScore: 1, awayScore: 0, status: MatchStatus.FINISHED, minute: 90, round: 'Matchday 8', date: new Date('2025-11-02T18:00:00Z'), venue: 'Stade Mohammed V', referee: 'Nabil Benrhouma', attendance: 60000 },
    { key: 'caf1', competition: 'CAF Champions League', homeTeam: 'Al Ahly SC', awayTeam: 'Wydad Casablanca', homeScore: 2, awayScore: 0, status: MatchStatus.FINISHED, minute: 90, round: 'Semi Final 1st Leg', date: new Date('2026-04-18T20:00:00Z'), venue: 'Cairo International Stadium', referee: 'Bamlak Tessema', attendance: 75000 },
    { key: 'caf2', competition: 'CAF Champions League', homeTeam: 'Zamalek SC', awayTeam: 'Al Ahly SC', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Group Stage', date: new Date('2026-09-06T20:00:00Z'), venue: 'Cairo International Stadium', referee: '', attendance: 0 },
    { key: 'wc1', competition: 'FIFA World Cup 2026', homeTeam: 'Morocco National Team', awayTeam: 'France National Team', homeScore: 1, awayScore: 0, status: MatchStatus.FINISHED, minute: 90, round: 'Quarter Final', date: new Date('2026-07-04T16:00:00Z'), venue: 'Estadio Azteca', referee: 'Wilton Sampaio', attendance: 85000 },
    { key: 'wc2', competition: 'FIFA World Cup 2026', homeTeam: 'Brazil National Team', awayTeam: 'Argentina National Team', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Group Stage', date: new Date('2026-07-18T20:00:00Z'), venue: 'MetLife Stadium', referee: '', attendance: 0 },
    { key: 'wc3', competition: 'FIFA World Cup 2026', homeTeam: 'France National Team', awayTeam: 'Brazil National Team', homeScore: 1, awayScore: 2, status: MatchStatus.LIVE, minute: 78, round: 'Semi Final', date: new Date('2026-06-08T20:00:00Z'), venue: 'SoFi Stadium', referee: 'Michael Oliver', attendance: 70000 },
    { key: 'friendly1', competition: 'International Friendlies', homeTeam: 'Morocco National Team', awayTeam: 'Brazil National Team', homeScore: 2, awayScore: 2, status: MatchStatus.FINISHED, minute: 90, round: 'Friendly', date: new Date('2026-03-25T20:00:00Z'), venue: 'Prince Moulay Abdellah Stadium', referee: 'Bamlak Tessema', attendance: 45000 },
    { key: 'friendly2', competition: 'International Friendlies', homeTeam: 'Argentina National Team', awayTeam: 'France National Team', homeScore: 3, awayScore: 3, status: MatchStatus.FINISHED, minute: 90, round: 'Friendly', date: new Date('2026-03-28T20:00:00Z'), venue: 'Estadio Monumental', referee: 'Wilton Sampaio', attendance: 70000 },
    { key: 'friendly3', competition: 'International Friendlies', homeTeam: 'Argentina National Team', awayTeam: 'Morocco National Team', homeScore: null, awayScore: null, status: MatchStatus.SCHEDULED, minute: 0, round: 'Friendly', date: new Date('2026-10-12T20:00:00Z'), venue: 'Estadio Monumental', referee: '', attendance: 0 },
  ];

  const matchIdMap: Record<string, string> = {};
  for (const m of matchData) {
    const created = await prisma.match.create({
      data: {
        competitionId: comps[m.competition]!,
        homeTeamId: teams[m.homeTeam]!,
        awayTeamId: teams[m.awayTeam]!,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: m.status,
        minute: m.minute,
        round: m.round,
        date: m.date,
        venue: m.venue,
        referee: m.referee || null,
        attendance: m.attendance || null,
      }
    });
    matches[m.key] = created.id;
    matchIdMap[m.key] = created.id;
  }
  console.log('Created matches');

  const matchEvents: Array<{
    matchKey: string; team: string; player: string; assistPlayer?: string;
    type: EventType; minute: number; addedTime?: number; description?: string; xg?: number
  }> = [
    { matchKey: 'ucl-qf1', team: 'Real Madrid', player: 'Vinícius Júnior', assistPlayer: 'Jude Bellingham', type: EventType.GOAL, minute: 12, xg: 0.42 },
    { matchKey: 'ucl-qf1', team: 'Bayern Munich', player: 'Harry Kane', type: EventType.PENALTY, minute: 45, xg: 0.78 },
    { matchKey: 'ucl-qf1', team: 'Real Madrid', player: 'Kylian Mbappé', assistPlayer: 'Vinícius Júnior', type: EventType.GOAL, minute: 78, xg: 0.35 },
    { matchKey: 'ucl-qf1', team: 'Bayern Munich', player: 'Joshua Kimmich', type: EventType.YELLOW_CARD, minute: 55 },
    { matchKey: 'ucl-qf1', team: 'Real Madrid', player: 'Antonio Rüdiger', type: EventType.YELLOW_CARD, minute: 60 },
    { matchKey: 'ucl-qf2', team: 'Bayern Munich', player: 'Harry Kane', assistPlayer: 'Jamal Musiala', type: EventType.GOAL, minute: 25, xg: 0.38 },
    { matchKey: 'ucl-qf2', team: 'Real Madrid', player: 'Jude Bellingham', assistPlayer: 'Vinícius Júnior', type: EventType.GOAL, minute: 67, xg: 0.51 },
    { matchKey: 'ucl-qf2', team: 'Real Madrid', player: 'Éder Militão', type: EventType.YELLOW_CARD, minute: 80 },
    { matchKey: 'ucl-qf2', team: 'Bayern Munich', player: 'Leroy Sané', type: EventType.SUBSTITUTION, minute: 60 },
    { matchKey: 'ucl-final', team: 'Manchester City', player: 'Rodri', assistPlayer: 'Kevin De Bruyne', type: EventType.GOAL, minute: 68, xg: 0.23 },
    { matchKey: 'ucl-final', team: 'Inter Milan', player: 'Lautaro Martínez', type: EventType.YELLOW_CARD, minute: 45 },
    { matchKey: 'ucl-final', team: 'Manchester City', player: 'Erling Haaland', type: EventType.YELLOW_CARD, minute: 72 },
    { matchKey: 'ucl-gs1', team: 'FC Barcelona', player: 'Robert Lewandowski', assistPlayer: 'Pedri', type: EventType.GOAL, minute: 8, xg: 0.45 },
    { matchKey: 'ucl-gs1', team: 'Paris Saint-Germain', player: 'Ousmane Dembélé', type: EventType.GOAL, minute: 22, xg: 0.31 },
    { matchKey: 'ucl-gs1', team: 'FC Barcelona', player: 'Robert Lewandowski', assistPlayer: 'Lamine Yamal', type: EventType.GOAL, minute: 45, xg: 0.52 },
    { matchKey: 'ucl-gs1', team: 'Paris Saint-Germain', player: 'Kylian Mbappé', type: EventType.PENALTY, minute: 67, xg: 0.79 },
    { matchKey: 'ucl-gs1', team: 'FC Barcelona', player: 'Lamine Yamal', assistPlayer: 'Pedri', type: EventType.GOAL, minute: 89, xg: 0.18 },
    { matchKey: 'ucl-gs4', team: 'Borussia Dortmund', player: 'Karim Adeyemi', assistPlayer: 'Julian Brandt', type: EventType.GOAL, minute: 34, xg: 0.41 },
    { matchKey: 'ucl-gs4', team: 'Juventus', player: 'Dušan Vlahović', assistPlayer: 'Federico Chiesa', type: EventType.GOAL, minute: 52, xg: 0.37 },
    { matchKey: 'ucl-gs4', team: 'Borussia Dortmund', player: 'Nico Schlotterbeck', type: EventType.YELLOW_CARD, minute: 40 },
    { matchKey: 'ucl-gs5', team: 'FC Barcelona', player: 'Gavi', type: EventType.GOAL, minute: 12, xg: 0.29 },
    { matchKey: 'ucl-gs5', team: 'Paris Saint-Germain', player: 'Achraf Hakimi', assistPlayer: 'Ousmane Dembélé', type: EventType.GOAL, minute: 35, xg: 0.33 },
    { matchKey: 'ucl-gs5', team: 'Paris Saint-Germain', player: 'Gianluigi Donnarumma', type: EventType.SAVE, minute: 58 },
    { matchKey: 'epl1', team: 'Manchester City', player: 'Erling Haaland', assistPlayer: 'Kevin De Bruyne', type: EventType.GOAL, minute: 18, xg: 0.62 },
    { matchKey: 'epl1', team: 'Liverpool FC', player: 'Mohamed Salah', assistPlayer: 'Trent Alexander-Arnold', type: EventType.GOAL, minute: 32, xg: 0.47 },
    { matchKey: 'epl1', team: 'Manchester City', player: 'Phil Foden', assistPlayer: 'Rodri', type: EventType.GOAL, minute: 55, xg: 0.34 },
    { matchKey: 'epl1', team: 'Liverpool FC', player: 'Alexis Mac Allister', assistPlayer: 'Mohamed Salah', type: EventType.GOAL, minute: 78, xg: 0.28 },
    { matchKey: 'epl1', team: 'Manchester City', player: 'Rodri', type: EventType.YELLOW_CARD, minute: 60 },
    { matchKey: 'epl2', team: 'Arsenal FC', player: 'Bukayo Saka', assistPlayer: 'Martin Ødegaard', type: EventType.GOAL, minute: 15, xg: 0.38 },
    { matchKey: 'epl2', team: 'Manchester City', player: 'Erling Haaland', assistPlayer: 'Phil Foden', type: EventType.GOAL, minute: 28, xg: 0.55 },
    { matchKey: 'epl2', team: 'Manchester City', player: 'Kevin De Bruyne', type: EventType.GOAL, minute: 44, xg: 0.19 },
    { matchKey: 'epl2', team: 'Manchester City', player: 'Erling Haaland', type: EventType.GOAL, minute: 67, xg: 0.71 },
    { matchKey: 'epl2', team: 'Arsenal FC', player: 'Declan Rice', type: EventType.RED_CARD, minute: 82 },
    { matchKey: 'epl2', team: 'Manchester City', player: 'Ruben Dias', type: EventType.YELLOW_CARD, minute: 90 },
    { matchKey: 'laliga1', team: 'Real Madrid', player: 'Vinícius Júnior', assistPlayer: 'Jude Bellingham', type: EventType.GOAL, minute: 24, xg: 0.44 },
    { matchKey: 'laliga1', team: 'Real Madrid', player: 'Kylian Mbappé', assistPlayer: 'Vinícius Júnior', type: EventType.GOAL, minute: 68, xg: 0.39 },
    { matchKey: 'laliga1', team: 'FC Barcelona', player: 'Ronald Araújo', type: EventType.YELLOW_CARD, minute: 55 },
    { matchKey: 'laliga1', team: 'Real Madrid', player: 'Antonio Rüdiger', type: EventType.RED_CARD, minute: 85 },
    { matchKey: 'bundes1', team: 'Bayern Munich', player: 'Harry Kane', assistPlayer: 'Jamal Musiala', type: EventType.GOAL, minute: 15, xg: 0.48 },
    { matchKey: 'bundes1', team: 'Bayern Munich', player: 'Leroy Sané', assistPlayer: 'Joshua Kimmich', type: EventType.GOAL, minute: 42, xg: 0.32 },
    { matchKey: 'bundes1', team: 'Bayern Munich', player: 'Harry Kane', assistPlayer: 'Jamal Musiala', type: EventType.GOAL, minute: 73, xg: 0.56 },
    { matchKey: 'bundes1', team: 'Borussia Dortmund', player: 'Nico Schlotterbeck', type: EventType.YELLOW_CARD, minute: 30 },
    { matchKey: 'bundes3', team: 'Bayern Munich', player: 'Jamal Musiala', type: EventType.GOAL, minute: 8, xg: 0.27 },
    { matchKey: 'bundes3', team: 'Borussia Dortmund', player: 'Karim Adeyemi', assistPlayer: 'Julian Brandt', type: EventType.GOAL, minute: 22, xg: 0.36 },
    { matchKey: 'bundes3', team: 'Bayern Munich', player: 'Harry Kane', type: EventType.PENALTY, minute: 35, xg: 0.76 },
    { matchKey: 'bundes3', team: 'Bayern Munich', player: 'Leroy Sané', assistPlayer: 'Joshua Kimmich', type: EventType.GOAL, minute: 55, xg: 0.41 },
    { matchKey: 'bundes3', team: 'Borussia Dortmund', player: 'Julian Brandt', assistPlayer: 'Karim Adeyemi', type: EventType.GOAL, minute: 68, xg: 0.33 },
    { matchKey: 'bundes3', team: 'Bayern Munich', player: 'Harry Kane', assistPlayer: 'Jamal Musiala', type: EventType.GOAL, minute: 82, xg: 0.44 },
    { matchKey: 'seriea1', team: 'Inter Milan', player: 'Lautaro Martínez', assistPlayer: 'Nicolò Barella', type: EventType.GOAL, minute: 12, xg: 0.52 },
    { matchKey: 'seriea1', team: 'AC Milan', player: 'Rafael Leão', assistPlayer: 'Theo Hernández', type: EventType.GOAL, minute: 38, xg: 0.41 },
    { matchKey: 'seriea1', team: 'Inter Milan', player: 'Nicolò Barella', assistPlayer: 'Hakan Calhanoglu', type: EventType.GOAL, minute: 62, xg: 0.29 },
    { matchKey: 'seriea1', team: 'AC Milan', player: 'Theo Hernández', type: EventType.YELLOW_CARD, minute: 55 },
    { matchKey: 'seriea3', team: 'Juventus', player: 'Dušan Vlahović', assistPlayer: 'Federico Chiesa', type: EventType.GOAL, minute: 28, xg: 0.43 },
    { matchKey: 'seriea3', team: 'Inter Milan', player: 'Nicolò Barella', type: EventType.YELLOW_CARD, minute: 45 },
    { matchKey: 'ligue1-1', team: 'Paris Saint-Germain', player: 'Ousmane Dembélé', assistPlayer: 'Achraf Hakimi', type: EventType.GOAL, minute: 14, xg: 0.31 },
    { matchKey: 'ligue1-1', team: 'Paris Saint-Germain', player: 'Kylian Mbappé', type: EventType.GOAL, minute: 33, xg: 0.47 },
    { matchKey: 'ligue1-1', team: 'Olympique Marseille', player: 'Pierre-Emerick Aubameyang', assistPlayer: 'Amine Harit', type: EventType.GOAL, minute: 58, xg: 0.36 },
    { matchKey: 'ligue1-1', team: 'Paris Saint-Germain', player: 'Ousmane Dembélé', assistPlayer: 'Achraf Hakimi', type: EventType.GOAL, minute: 76, xg: 0.28 },
    { matchKey: 'ligue1-3', team: 'Paris Saint-Germain', player: 'Kylian Mbappé', assistPlayer: 'Ousmane Dembélé', type: EventType.GOAL, minute: 42, xg: 0.45 },
    { matchKey: 'ligue1-3', team: 'Paris Saint-Germain', player: 'Kylian Mbappé', assistPlayer: 'Achraf Hakimi', type: EventType.GOAL, minute: 71, xg: 0.39 },
    { matchKey: 'ligue1-3', team: 'Olympique Marseille', player: 'Amine Harit', type: EventType.YELLOW_CARD, minute: 55 },
    { matchKey: 'botola1', team: 'Wydad Casablanca', player: 'Mouad Madani', assistPlayer: 'Yahya Jabrane', type: EventType.GOAL, minute: 23, xg: 0.34 },
    { matchKey: 'botola1', team: 'Raja Casablanca', player: 'Yousri Bouzok', assistPlayer: 'Mohamed Zrida', type: EventType.GOAL, minute: 41, xg: 0.29 },
    { matchKey: 'botola1', team: 'Raja Casablanca', player: 'Mohamed Zrida', type: EventType.YELLOW_CARD, minute: 55 },
    { matchKey: 'botola3', team: 'Wydad Casablanca', player: 'Mouad Madani', assistPlayer: 'Yahya Jabrane', type: EventType.GOAL, minute: 67, xg: 0.32 },
    { matchKey: 'botola3', team: 'Raja Casablanca', player: 'Yousri Bouzok', type: EventType.YELLOW_CARD, minute: 80 },
    { matchKey: 'caf1', team: 'Al Ahly SC', player: 'Percy Tau', assistPlayer: 'Hussein El Shahat', type: EventType.GOAL, minute: 34, xg: 0.37 },
    { matchKey: 'caf1', team: 'Al Ahly SC', player: 'Percy Tau', type: EventType.GOAL, minute: 61, xg: 0.42 },
    { matchKey: 'caf1', team: 'Wydad Casablanca', player: 'Yahya Jabrane', type: EventType.YELLOW_CARD, minute: 50 },
    { matchKey: 'wc1', team: 'Morocco National Team', player: 'Youssef En-Nesyri', assistPlayer: 'Hakim Ziyech', type: EventType.GOAL, minute: 42, xg: 0.26 },
    { matchKey: 'wc1', team: 'Morocco National Team', player: 'Sofyan Amrabat', type: EventType.YELLOW_CARD, minute: 55 },
    { matchKey: 'wc1', team: 'France National Team', player: 'Antoine Griezmann', type: EventType.YELLOW_CARD, minute: 70 },
    { matchKey: 'wc3', team: 'France National Team', player: 'Antoine Griezmann', assistPlayer: 'Aurélien Tchouaméni', type: EventType.GOAL, minute: 23, xg: 0.31 },
    { matchKey: 'wc3', team: 'Brazil National Team', player: 'Rodrygo', assistPlayer: 'Vinícius Júnior', type: EventType.GOAL, minute: 45, xg: 0.39 },
    { matchKey: 'wc3', team: 'Brazil National Team', player: 'Marquinhos', type: EventType.GOAL, minute: 62, xg: 0.19 },
    { matchKey: 'friendly1', team: 'Morocco National Team', player: 'Hakim Ziyech', assistPlayer: 'Sofyan Amrabat', type: EventType.GOAL, minute: 18, xg: 0.35 },
    { matchKey: 'friendly1', team: 'Brazil National Team', player: 'Rodrygo', assistPlayer: 'Vinícius Júnior', type: EventType.GOAL, minute: 33, xg: 0.42 },
    { matchKey: 'friendly1', team: 'Morocco National Team', player: 'Youssef En-Nesyri', assistPlayer: 'Noussair Mazraoui', type: EventType.GOAL, minute: 60, xg: 0.38 },
    { matchKey: 'friendly1', team: 'Brazil National Team', player: 'Marquinhos', assistPlayer: 'Alisson Becker', type: EventType.GOAL, minute: 81, xg: 0.15 },
    { matchKey: 'friendly2', team: 'Argentina National Team', player: 'Lionel Messi', type: EventType.GOAL, minute: 15, xg: 0.44 },
    { matchKey: 'friendly2', team: 'France National Team', player: 'Kylian Mbappé', assistPlayer: 'Antoine Griezmann', type: EventType.GOAL, minute: 28, xg: 0.51 },
    { matchKey: 'friendly2', team: 'Argentina National Team', player: 'Julián Álvarez', assistPlayer: 'Lionel Messi', type: EventType.GOAL, minute: 42, xg: 0.37 },
    { matchKey: 'friendly2', team: 'France National Team', player: 'Kylian Mbappé', type: EventType.PENALTY, minute: 55, xg: 0.76 },
    { matchKey: 'friendly2', team: 'Argentina National Team', player: 'Lionel Messi', assistPlayer: 'Enzo Fernández', type: EventType.GOAL, minute: 70, xg: 0.33 },
    { matchKey: 'friendly2', team: 'France National Team', player: 'Antoine Griezmann', assistPlayer: 'Kylian Mbappé', type: EventType.GOAL, minute: 88, xg: 0.25 },
    { matchKey: 'friendly2', team: 'Argentina National Team', player: 'Cristian Romero', type: EventType.YELLOW_CARD, minute: 75 },
  ];

  for (const evt of matchEvents) {
    await prisma.matchEvent.create({
      data: {
        matchId: matches[evt.matchKey]!,
        teamId: teams[evt.team]!,
        playerId: players[evt.player]!,
        assistPlayerId: evt.assistPlayer ? players[evt.assistPlayer]! : null,
        type: evt.type,
        minute: evt.minute,
        addedTime: evt.addedTime,
        description: evt.description,
        xg: evt.xg,
      }
    });
  }
  console.log('Created match events');

  const standingsData: Array<{
    competition: string; team: string; position: number;
    playedGames: number; won: number; drawn: number; lost: number;
    goalsFor: number; goalsAgainst: number; points: number; form: string[]
  }> = [
    { competition: 'Premier League', team: 'Manchester City', position: 1, playedGames: 35, won: 27, drawn: 5, lost: 3, goalsFor: 89, goalsAgainst: 28, points: 86, form: ['W', 'W', 'W', 'D', 'W'] },
    { competition: 'Premier League', team: 'Liverpool FC', position: 2, playedGames: 35, won: 24, drawn: 8, lost: 3, goalsFor: 78, goalsAgainst: 32, points: 80, form: ['W', 'D', 'W', 'W', 'D'] },
    { competition: 'Premier League', team: 'Arsenal FC', position: 3, playedGames: 35, won: 23, drawn: 6, lost: 6, goalsFor: 75, goalsAgainst: 35, points: 75, form: ['W', 'W', 'L', 'W', 'W'] },
    { competition: 'La Liga', team: 'Real Madrid', position: 1, playedGames: 34, won: 26, drawn: 6, lost: 2, goalsFor: 72, goalsAgainst: 22, points: 84, form: ['W', 'W', 'D', 'W', 'W'] },
    { competition: 'La Liga', team: 'FC Barcelona', position: 2, playedGames: 34, won: 23, drawn: 7, lost: 4, goalsFor: 68, goalsAgainst: 30, points: 76, form: ['W', 'D', 'W', 'L', 'W'] },
    { competition: 'Bundesliga', team: 'Bayern Munich', position: 1, playedGames: 32, won: 25, drawn: 4, lost: 3, goalsFor: 92, goalsAgainst: 28, points: 79, form: ['W', 'W', 'W', 'W', 'D'] },
    { competition: 'Bundesliga', team: 'Borussia Dortmund', position: 4, playedGames: 32, won: 18, drawn: 8, lost: 6, goalsFor: 62, goalsAgainst: 38, points: 62, form: ['W', 'L', 'W', 'D', 'L'] },
    { competition: 'Serie A', team: 'Inter Milan', position: 1, playedGames: 34, won: 26, drawn: 5, lost: 3, goalsFor: 71, goalsAgainst: 22, points: 83, form: ['W', 'W', 'D', 'W', 'W'] },
    { competition: 'Serie A', team: 'AC Milan', position: 2, playedGames: 34, won: 21, drawn: 8, lost: 5, goalsFor: 58, goalsAgainst: 32, points: 71, form: ['W', 'D', 'W', 'W', 'L'] },
    { competition: 'Serie A', team: 'Juventus', position: 3, playedGames: 34, won: 19, drawn: 10, lost: 5, goalsFor: 52, goalsAgainst: 28, points: 67, form: ['D', 'W', 'D', 'W', 'W'] },
    { competition: 'Ligue 1', team: 'Paris Saint-Germain', position: 1, playedGames: 33, won: 25, drawn: 5, lost: 3, goalsFor: 82, goalsAgainst: 26, points: 80, form: ['W', 'W', 'W', 'D', 'W'] },
    { competition: 'Ligue 1', team: 'Olympique Marseille', position: 3, playedGames: 33, won: 17, drawn: 10, lost: 6, goalsFor: 52, goalsAgainst: 35, points: 61, form: ['D', 'W', 'L', 'W', 'D'] },
    { competition: 'Botola Pro', team: 'Wydad Casablanca', position: 2, playedGames: 28, won: 18, drawn: 6, lost: 4, goalsFor: 45, goalsAgainst: 18, points: 60, form: ['W', 'W', 'D', 'W', 'W'] },
    { competition: 'Botola Pro', team: 'Raja Casablanca', position: 1, playedGames: 28, won: 19, drawn: 5, lost: 4, goalsFor: 48, goalsAgainst: 16, points: 62, form: ['W', 'W', 'W', 'D', 'W'] },
  ];

  for (const s of standingsData) {
    await prisma.standing.create({
      data: {
        competitionId: comps[s.competition]!,
        teamId: teams[s.team]!,
        position: s.position,
        playedGames: s.playedGames,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDifference: s.goalsFor - s.goalsAgainst,
        points: s.points,
        form: s.form,
      }
    });
  }
  console.log('Created standings');

  const matchStats: Array<{
    matchKey: string; category: StatCategory; homeValue: number; awayValue: number
  }> = [
    { matchKey: 'ucl-qf1', category: StatCategory.POSSESSION, homeValue: 58, awayValue: 42 },
    { matchKey: 'ucl-qf1', category: StatCategory.SHOTS, homeValue: 14, awayValue: 9 },
    { matchKey: 'ucl-qf1', category: StatCategory.SHOTS_ON_TARGET, homeValue: 6, awayValue: 4 },
    { matchKey: 'ucl-qf1', category: StatCategory.CORNERS, homeValue: 7, awayValue: 3 },
    { matchKey: 'ucl-qf1', category: StatCategory.FOULS, homeValue: 12, awayValue: 14 },
    { matchKey: 'ucl-qf1', category: StatCategory.YELLOW_CARDS, homeValue: 2, awayValue: 1 },
    { matchKey: 'ucl-qf1', category: StatCategory.OFFSIDES, homeValue: 3, awayValue: 1 },
    { matchKey: 'ucl-qf2', category: StatCategory.POSSESSION, homeValue: 52, awayValue: 48 },
    { matchKey: 'ucl-qf2', category: StatCategory.SHOTS, homeValue: 11, awayValue: 12 },
    { matchKey: 'ucl-qf2', category: StatCategory.SHOTS_ON_TARGET, homeValue: 4, awayValue: 5 },
    { matchKey: 'ucl-qf2', category: StatCategory.CORNERS, homeValue: 5, awayValue: 6 },
    { matchKey: 'ucl-final', category: StatCategory.POSSESSION, homeValue: 55, awayValue: 45 },
    { matchKey: 'ucl-final', category: StatCategory.SHOTS, homeValue: 13, awayValue: 8 },
    { matchKey: 'ucl-final', category: StatCategory.SHOTS_ON_TARGET, homeValue: 5, awayValue: 2 },
    { matchKey: 'ucl-final', category: StatCategory.SAVES, homeValue: 2, awayValue: 4 },
    { matchKey: 'epl1', category: StatCategory.POSSESSION, homeValue: 53, awayValue: 47 },
    { matchKey: 'epl1', category: StatCategory.SHOTS, homeValue: 15, awayValue: 12 },
    { matchKey: 'epl1', category: StatCategory.SHOTS_ON_TARGET, homeValue: 7, awayValue: 6 },
    { matchKey: 'epl1', category: StatCategory.CORNERS, homeValue: 8, awayValue: 4 },
    { matchKey: 'epl1', category: StatCategory.FOULS, homeValue: 10, awayValue: 8 },
    { matchKey: 'laliga1', category: StatCategory.POSSESSION, homeValue: 45, awayValue: 55 },
    { matchKey: 'laliga1', category: StatCategory.SHOTS, homeValue: 10, awayValue: 16 },
    { matchKey: 'laliga1', category: StatCategory.SHOTS_ON_TARGET, homeValue: 5, awayValue: 7 },
    { matchKey: 'laliga1', category: StatCategory.CORNERS, homeValue: 3, awayValue: 8 },
    { matchKey: 'laliga1', category: StatCategory.FOULS, homeValue: 18, awayValue: 10 },
    { matchKey: 'laliga1', category: StatCategory.YELLOW_CARDS, homeValue: 4, awayValue: 2 },
    { matchKey: 'laliga1', category: StatCategory.RED_CARDS, homeValue: 1, awayValue: 0 },
    { matchKey: 'bundes1', category: StatCategory.POSSESSION, homeValue: 62, awayValue: 38 },
    { matchKey: 'bundes1', category: StatCategory.SHOTS, homeValue: 18, awayValue: 6 },
    { matchKey: 'bundes1', category: StatCategory.SHOTS_ON_TARGET, homeValue: 8, awayValue: 2 },
    { matchKey: 'bundes1', category: StatCategory.CORNERS, homeValue: 10, awayValue: 2 },
    { matchKey: 'seriea1', category: StatCategory.POSSESSION, homeValue: 48, awayValue: 52 },
    { matchKey: 'seriea1', category: StatCategory.SHOTS, homeValue: 12, awayValue: 14 },
    { matchKey: 'seriea1', category: StatCategory.SHOTS_ON_TARGET, homeValue: 5, awayValue: 6 },
    { matchKey: 'seriea1', category: StatCategory.FOULS, homeValue: 14, awayValue: 16 },
    { matchKey: 'ligue1-1', category: StatCategory.POSSESSION, homeValue: 61, awayValue: 39 },
    { matchKey: 'ligue1-1', category: StatCategory.SHOTS, homeValue: 17, awayValue: 7 },
    { matchKey: 'ligue1-1', category: StatCategory.SHOTS_ON_TARGET, homeValue: 8, awayValue: 3 },
    { matchKey: 'ligue1-1', category: StatCategory.CORNERS, homeValue: 9, awayValue: 2 },
    { matchKey: 'wc1', category: StatCategory.POSSESSION, homeValue: 42, awayValue: 58 },
    { matchKey: 'wc1', category: StatCategory.SHOTS, homeValue: 8, awayValue: 15 },
    { matchKey: 'wc1', category: StatCategory.SHOTS_ON_TARGET, homeValue: 4, awayValue: 6 },
    { matchKey: 'wc1', category: StatCategory.SAVES, homeValue: 6, awayValue: 3 },
    { matchKey: 'friendly1', category: StatCategory.POSSESSION, homeValue: 48, awayValue: 52 },
    { matchKey: 'friendly1', category: StatCategory.SHOTS, homeValue: 11, awayValue: 13 },
    { matchKey: 'friendly1', category: StatCategory.SHOTS_ON_TARGET, homeValue: 5, awayValue: 6 },
    { matchKey: 'friendly1', category: StatCategory.CORNERS, homeValue: 4, awayValue: 7 },
  ];

  for (const ms of matchStats) {
    await prisma.matchStatistic.create({
      data: {
        matchId: matches[ms.matchKey]!,
        category: ms.category,
        homeValue: ms.homeValue,
        awayValue: ms.awayValue,
      }
    });
  }
  console.log('Created match statistics');

  const commentaries: Array<{
    matchKey: string; minute: number; text: string; isImportant: boolean; type: string
  }> = [
    { matchKey: 'ucl-qf1', minute: 1, text: 'The match is underway at the Santiago Bernabéu!', isImportant: true, type: 'MATCH_START' },
    { matchKey: 'ucl-qf1', minute: 12, text: 'GOAL! Vinícius Júnior scores for Real Madrid! Assisted by Jude Bellingham.', isImportant: true, type: 'GOAL' },
    { matchKey: 'ucl-qf1', minute: 45, text: 'PENALTY GOAL! Harry Kane equalizes from the spot for Bayern Munich.', isImportant: true, type: 'GOAL' },
    { matchKey: 'ucl-qf1', minute: 55, text: 'Yellow card for Joshua Kimmich after a late challenge.', isImportant: false, type: 'YELLOW_CARD' },
    { matchKey: 'ucl-qf1', minute: 78, text: 'GOAL! Kylian Mbappé puts Real Madrid ahead! What a counter-attack!', isImportant: true, type: 'GOAL' },
    { matchKey: 'ucl-qf1', minute: 90, text: "Full time! Real Madrid wins 2-1 in the first leg.", isImportant: true, type: 'FULL_TIME' },
    { matchKey: 'ucl-final', minute: 1, text: 'The UEFA Champions League Final is underway at Wembley!', isImportant: true, type: 'MATCH_START' },
    { matchKey: 'ucl-final', minute: 68, text: 'GOAL! Rodri scores for Manchester City! A composed finish into the bottom corner.', isImportant: true, type: 'GOAL' },
    { matchKey: 'ucl-final', minute: 90, text: 'The final whistle blows! Manchester City are European Champions!', isImportant: true, type: 'FULL_TIME' },
    { matchKey: 'epl1', minute: 18, text: 'GOAL! Erling Haaland opens the scoring for Manchester City!', isImportant: true, type: 'GOAL' },
    { matchKey: 'epl1', minute: 32, text: 'GOAL! Mohamed Salah equalizes for Liverpool! A brilliant team move.', isImportant: true, type: 'GOAL' },
    { matchKey: 'epl1', minute: 55, text: 'GOAL! Phil Foden restores City\'s lead with a beautiful strike!', isImportant: true, type: 'GOAL' },
    { matchKey: 'epl1', minute: 78, text: 'GOAL! Alexis Mac Allister makes it 2-2! What a game!', isImportant: true, type: 'GOAL' },
    { matchKey: 'epl1', minute: 90, text: 'Full time! An entertaining 2-2 draw at the Etihad.', isImportant: true, type: 'FULL_TIME' },
    { matchKey: 'botola1', minute: 23, text: 'GOAL! Mouad Madani heads Wydad into the lead from a corner!', isImportant: true, type: 'GOAL' },
    { matchKey: 'botola1', minute: 41, text: 'GOAL! Yousri Bouzok equalizes for Raja with a stunning volley!', isImportant: true, type: 'GOAL' },
    { matchKey: 'wc1', minute: 42, text: 'GOAL! Youssef En-Nesyri scores for Morocco! The Atlas Lions lead!', isImportant: true, type: 'GOAL' },
    { matchKey: 'wc1', minute: 55, text: 'Sofyan Amrabat goes into the book for a tactical foul.', isImportant: false, type: 'YELLOW_CARD' },
    { matchKey: 'wc1', minute: 90, text: "Full time! Morocco shocks France and advances to the semi-finals!", isImportant: true, type: 'FULL_TIME' },
    { matchKey: 'friendly2', minute: 15, text: 'GOAL! Lionel Messi opens the scoring for Argentina! A typical curling effort.', isImportant: true, type: 'GOAL' },
    { matchKey: 'friendly2', minute: 28, text: 'GOAL! Kylian Mbappé equalizes for France! Lightning counter-attack.', isImportant: true, type: 'GOAL' },
    { matchKey: 'friendly2', minute: 42, text: 'GOAL! Julián Álvarez scores! Argentina back in front!', isImportant: true, type: 'GOAL' },
    { matchKey: 'friendly2', minute: 55, text: 'PENALTY GOAL! Kylian Mbappé makes it 2-2 from the spot!', isImportant: true, type: 'GOAL' },
    { matchKey: 'friendly2', minute: 70, text: 'GOAL! Lionel Messi scores again! Argentina leads 3-2!', isImportant: true, type: 'GOAL' },
    { matchKey: 'friendly2', minute: 88, text: 'GOAL! Antoine Griezmann makes it 3-3! This game has everything!', isImportant: true, type: 'GOAL' },
    { matchKey: 'friendly2', minute: 90, text: "Full time! An incredible 3-3 draw between Argentina and France.", isImportant: true, type: 'FULL_TIME' },
  ];

  for (const c of commentaries) {
    await prisma.commentary.create({
      data: {
        matchId: matches[c.matchKey]!,
        minute: c.minute,
        text: c.text,
        isImportant: c.isImportant,
        type: c.type,
      }
    });
  }
  console.log('Created commentaries');

  const headToHeads = [
    { homeTeam: 'Real Madrid', awayTeam: 'FC Barcelona', totalMatches: 256, homeWins: 104, awayWins: 72, draws: 80, homeGoals: 375, awayGoals: 310 },
    { homeTeam: 'Manchester City', awayTeam: 'Liverpool FC', totalMatches: 55, homeWins: 18, awayWins: 22, draws: 15, homeGoals: 72, awayGoals: 78 },
    { homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund', totalMatches: 138, homeWins: 68, awayWins: 35, draws: 35, homeGoals: 245, awayGoals: 170 },
    { homeTeam: 'Inter Milan', awayTeam: 'AC Milan', totalMatches: 238, homeWins: 90, awayWins: 82, draws: 66, homeGoals: 330, awayGoals: 310 },
    { homeTeam: 'Paris Saint-Germain', awayTeam: 'Olympique Marseille', totalMatches: 45, homeWins: 22, awayWins: 12, draws: 11, homeGoals: 68, awayGoals: 48 },
    { homeTeam: 'Wydad Casablanca', awayTeam: 'Raja Casablanca', totalMatches: 142, homeWins: 55, awayWins: 48, draws: 39, homeGoals: 165, awayGoals: 152 },
    { homeTeam: 'Al Ahly SC', awayTeam: 'Zamalek SC', totalMatches: 235, homeWins: 95, awayWins: 72, draws: 68, homeGoals: 285, awayGoals: 248 },
    { homeTeam: 'Brazil National Team', awayTeam: 'Argentina National Team', totalMatches: 115, homeWins: 45, awayWins: 42, draws: 28, homeGoals: 160, awayGoals: 155 },
    { homeTeam: 'France National Team', awayTeam: 'Argentina National Team', totalMatches: 15, homeWins: 6, awayWins: 6, draws: 3, homeGoals: 22, awayGoals: 20 },
    { homeTeam: 'Morocco National Team', awayTeam: 'France National Team', totalMatches: 10, homeWins: 3, awayWins: 5, draws: 2, homeGoals: 10, awayGoals: 15 },
  ];

  const headToHeadIds: string[] = [];
  for (const h of headToHeads) {
    const created = await prisma.headToHead.create({
      data: {
        homeTeamId: teams[h.homeTeam]!,
        awayTeamId: teams[h.awayTeam]!,
        totalMatches: h.totalMatches,
        homeWins: h.homeWins,
        awayWins: h.awayWins,
        draws: h.draws,
        homeGoals: h.homeGoals,
        awayGoals: h.awayGoals,
      }
    });
    headToHeadIds.push(created.id);
  }
  console.log('Created head-to-head records');

  const headToHeadMatchLinks: Array<{ h2hHome: string; h2hAway: string; matchKey: string }> = [
    { h2hHome: 'Real Madrid', h2hAway: 'FC Barcelona', matchKey: 'laliga1' },
    { h2hHome: 'Real Madrid', h2hAway: 'FC Barcelona', matchKey: 'laliga2' },
    { h2hHome: 'Manchester City', h2hAway: 'Liverpool FC', matchKey: 'epl1' },
    { h2hHome: 'Bayern Munich', h2hAway: 'Borussia Dortmund', matchKey: 'bundes1' },
    { h2hHome: 'Bayern Munich', h2hAway: 'Borussia Dortmund', matchKey: 'bundes3' },
    { h2hHome: 'Inter Milan', h2hAway: 'AC Milan', matchKey: 'seriea1' },
    { h2hHome: 'Paris Saint-Germain', h2hAway: 'Olympique Marseille', matchKey: 'ligue1-1' },
    { h2hHome: 'Paris Saint-Germain', h2hAway: 'Olympique Marseille', matchKey: 'ligue1-3' },
    { h2hHome: 'Wydad Casablanca', h2hAway: 'Raja Casablanca', matchKey: 'botola1' },
    { h2hHome: 'Wydad Casablanca', h2hAway: 'Raja Casablanca', matchKey: 'botola3' },
    { h2hHome: 'France National Team', h2hAway: 'Argentina National Team', matchKey: 'friendly2' },
    { h2hHome: 'Morocco National Team', h2hAway: 'France National Team', matchKey: 'wc1' },
    { h2hHome: 'Morocco National Team', h2hAway: 'Brazil National Team', matchKey: 'friendly1' },
  ];

  for (const link of headToHeadMatchLinks) {
    const h2h = await prisma.headToHead.findFirst({
      where: { homeTeamId: teams[link.h2hHome]!, awayTeamId: teams[link.h2hAway]! }
    });
    const matchId = matchIdMap[link.matchKey]!;
    if (h2h && matchId) {
      await prisma.headToHeadMatch.create({
        data: { headToHeadId: h2h.id, matchId }
      });
    }
  }
  console.log('Created head-to-head match links');

  await prisma.userPreference.create({
    data: {
      userId: admin.id,
      theme: Theme.DARK,
      language: Language.EN,
      notificationsEnabled: true,
      pushEnabled: true,
      emailEnabled: true,
    }
  });
  await prisma.userPreference.create({
    data: {
      userId: regularUser.id,
      theme: Theme.SYSTEM,
      language: Language.EN,
      notificationsEnabled: true,
      pushEnabled: false,
      emailEnabled: true,
      favoriteTeams: [teams['Real Madrid']!, teams['FC Barcelona']!],
      favoriteCompetitions: [comps['UEFA Champions League']!, comps['La Liga']!],
      favoritePlayers: [players['Lionel Messi']!, players['Jude Bellingham']!, players['Vinícius Júnior']!],
    }
  });
  console.log('Created user preferences');

  await prisma.favorite.createMany({
    data: [
      { userId: regularUser.id, entityType: 'TEAM', entityId: teams['Real Madrid']! },
      { userId: regularUser.id, entityType: 'TEAM', entityId: teams['FC Barcelona']! },
      { userId: regularUser.id, entityType: 'COMPETITION', entityId: comps['UEFA Champions League']! },
      { userId: regularUser.id, entityType: 'PLAYER', entityId: players['Lionel Messi']! },
      { userId: regularUser.id, entityType: 'PLAYER', entityId: players['Jude Bellingham']! },
    ]
  });
  console.log('Created favorites');

  await prisma.userSubscription.createMany({
    data: [
      { userId: regularUser.id, type: SubscriptionType.TEAM, teamId: teams['Real Madrid']! },
      { userId: regularUser.id, type: SubscriptionType.COMPETITION, competitionId: comps['UEFA Champions League']! },
      { userId: regularUser.id, type: SubscriptionType.PLAYER, playerId: players['Lionel Messi']! },
      { userId: admin.id, type: SubscriptionType.COMPETITION, competitionId: comps['Botola Pro']! },
      { userId: admin.id, type: SubscriptionType.TEAM, teamId: teams['Wydad Casablanca']! },
      { userId: regularUser.id, type: SubscriptionType.MATCH, matchId: matches['ucl-gs4']! },
    ]
  });
  console.log('Created subscriptions');

  await prisma.notification.createMany({
    data: [
      { userId: regularUser.id, type: NotificationType.GOAL_SCORED, title: 'Goal Scored!', message: 'Vinícius Júnior scored for Real Madrid against Barcelona', data: { matchId: matches['laliga1']!, playerId: players['Vinícius Júnior']! }, read: false },
      { userId: regularUser.id, type: NotificationType.MATCH_STARTED, title: 'Match Started', message: 'Real Madrid vs Barcelona is now underway', data: { matchId: matches['laliga1']! }, read: true },
      { userId: regularUser.id, type: NotificationType.FULL_TIME, title: 'Full Time', message: 'Real Madrid 2-0 Barcelona', data: { matchId: matches['laliga1']! }, read: true },
      { userId: regularUser.id, type: NotificationType.RED_CARD, title: 'Red Card!', message: 'Antonio Rüdiger was sent off against Barcelona', data: { matchId: matches['laliga1']!, playerId: players['Antonio Rüdiger']! }, read: false },
      { userId: admin.id, type: NotificationType.MATCH_STARTED, title: 'Match Started', message: 'Wydad vs Raja Casablanca derby is underway!', data: { matchId: matches['botola1']! }, read: false },
      { userId: regularUser.id, type: NotificationType.MATCH_REMINDER, title: 'Match Reminder', message: 'Your favorite team Real Madrid plays tomorrow', data: { matchId: matches['ucl-gs5']! }, read: false },
    ]
  });
  console.log('Created notifications');

  const now = new Date();
  await prisma.season.createMany({
    data: [
      { competitionId: comps['UEFA Champions League']!, name: '2025/2026', startDate: new Date('2025-09-01'), endDate: new Date('2026-06-01'), isCurrent: true },
      { competitionId: comps['Premier League']!, name: '2025/2026', startDate: new Date('2025-08-01'), endDate: new Date('2026-05-25'), isCurrent: true },
      { competitionId: comps['La Liga']!, name: '2025/2026', startDate: new Date('2025-08-15'), endDate: new Date('2026-05-23'), isCurrent: true },
      { competitionId: comps['Serie A']!, name: '2025/2026', startDate: new Date('2025-08-20'), endDate: new Date('2026-05-25'), isCurrent: true },
      { competitionId: comps['Bundesliga']!, name: '2025/2026', startDate: new Date('2025-08-15'), endDate: new Date('2026-05-17'), isCurrent: true },
      { competitionId: comps['Ligue 1']!, name: '2025/2026', startDate: new Date('2025-08-10'), endDate: new Date('2026-05-24'), isCurrent: true },
      { competitionId: comps['CAF Champions League']!, name: '2025/2026', startDate: new Date('2025-09-15'), endDate: new Date('2026-06-15'), isCurrent: true },
      { competitionId: comps['Botola Pro']!, name: '2025/2026', startDate: new Date('2025-09-01'), endDate: new Date('2026-06-30'), isCurrent: true },
      { competitionId: comps['FIFA World Cup 2026']!, name: '2026', startDate: new Date('2026-06-15'), endDate: new Date('2026-07-20'), isCurrent: true },
    ]
  });
  console.log('Created seasons');

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
