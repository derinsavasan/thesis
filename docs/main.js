// ─────────────────────────────────────────────────────────
//  The Shapes of Stories · scrollytelling site
//  Plain HTML/CSS/JS + D3 v7 + scrollama + GSAP/ScrollTrigger/SplitText.
//  Serve from docs/ with `python -m http.server 8000`.
// ─────────────────────────────────────────────────────────

const DATA = "./thesis-outputs";

// Register every GSAP plugin we use. Bonus plugins (MorphSVG, ScrambleText)
// became free in GSAP 3.13.
const _gsapPlugins = ["ScrollTrigger", "SplitText", "MorphSVGPlugin", "ScrambleTextPlugin"]
  .map(n => window[n]).filter(Boolean);
if (window.gsap && _gsapPlugins.length) gsap.registerPlugin(..._gsapPlugins);

// palette
const C = {
  ink:       "#16191e",
  inkDim:    "#3f4651",
  inkFaint:  "#6c7585",
  bg:        "#eef0e7",
  bgRaise:   "#e2e5db",
  amber:     "#8a5a14",
  amberSoft: "#b07a1f",
  rule:      "#b7bdac",
  ruleSoft:  "#c8cdba",
  turnWarm:  "#c25a18",
  turnCool:  "#2b4a6f",
};

const ARCHETYPE_NAMES = {
  0: "Oedipus",
  1: "Icarus",
  2: "Man in a Hole",
  3: "Tragedy",
  4: "Rags to Riches",
  5: "Cinderella",
};
const ARCHETYPE_SHAPES = {
  0: "fall → rise → fall",
  1: "rise → fall",
  2: "fall → rise",
  3: "fall",
  4: "rise",
  5: "rise → fall → rise",
};
const ARCHETYPE_BLURBS = {
  0: "Opens steady, dips early, spends its middle quietly recovering. Climbs late and gets you on its side, only to collapse just when the ending feels earned. Hope, then the hope taken back. <em>Reservoir Dogs</em> is the textbook case: a heist gone wrong, a brief flicker of escape, then everyone bleeds out on the warehouse floor. <em>Catch Me If You Can</em> and <em>Kill Bill: Volume 1</em> live close by.",
  1: "Climbs steadily through the first half and peaks at the midpoint, when everything looks like it’s working. Then it falls hard, bottoming out late before crawling back just enough to land. <em>The Nutty Professor</em> is the cleanest example: Sherman Klump invents a serum, becomes the man he always wanted to be, and watches it eat him alive before he claws his way back. <em>Fight Club</em> sits close behind.",
  2: "If Hollywood has a favourite shape, this is it. More films land here than anywhere else. Things start steady, drop into a long stretch of trouble past the middle, and climb to the highest finish of any shape. <em>Inception</em> and <em>The Matrix</em> are the same shape running in opposite directions, one inward through dream layers, the other outward through a simulation.",
  3: "Opens at the highest starting point of any shape, peaks early, then falls until the end. No recovery. No turn. Just descent. <em>Anora</em> is the textbook case: a Brooklyn stripper marries a Russian oligarch’s son, lives the fantasy for an act, then loses it all. <em>Wedding Crashers</em> runs the same shape as a romcom, despite the genre. Turns out genre doesn’t dictate shape.",
  4: "Opens low, stays under water through the first half, then climbs to the highest finish of any shape. Start bad, end good. In <em>Gladiator</em>, Maximus loses everything, fights his way up, dies a free man. <em>The Truman Show</em> does it inside a TV set: a life built on a lie, the slow waking up to it, and a door that opens at the end.",
  5: "Opens high, falls hard in the first third, then climbs steadily back to finish near where it started. The structure is symmetrical: what was lost is restored. <em>Die Hard 2</em> nails it. <em>The Hangover</em> runs the same pattern played for laughs: four friends wake up in a trashed Vegas suite with no memory and a missing groom, retrace the night, and find him in time for the wedding.",
};
const ARCH_COLOR = {
  0: "#4a6da7",
  1: "#c84630",
  2: "#2a9d8f",
  3: "#8b2a4d",
  4: "#d4a017",
  5: "#6a4c93",
};
// Short, conversational blurbs shown on the flip side of each cluster card.
const ARCHETYPE_FLIP = {
  0: "From the Greek tragedy. He’s born under a curse, thinks he’s outrun it, finds out he hasn’t. Hope, then the hope taken back.",
  1: "From the Greek myth. A boy builds wax wings, flies too close to the sun, falls into the sea. Ambition that ends in the water.",
  2: "The shape that put Vonnegut on the lecture circuit. Someone falls into trouble and climbs back out. The dip is the whole story.",
  3: "Sometimes called “Riches to Rags.” Borrowed from the Greeks. Things are fine, then they aren’t, and they don’t recover.",
  4: "The underdog idiom. Someone starts with nothing and climbs into something. The simplest possible rise.",
  5: "The fairy tale traced as a curve. She makes it to the ball, loses it all at midnight, and is found again by the prince. Three turns, one happy ending.",
};
const ARCH_ORDER = [0, 1, 2, 3, 4, 5];
// Hand-drawn la-linea icons, one per archetype, used as a small mark in the
// upper-right corner of each card's flipped face.
const ARCHETYPE_ICONS = {
  0: "la-linea/linea_oedipus.png",
  1: "la-linea/linea_icarus.png",
  2: "la-linea/linea_man_in_a_hole.png",
  3: "la-linea/linea_tragedy.png",
  4: "la-linea/linea_rags_to_riches.png",
  5: "la-linea/linea_cinderella.png",
};

// Curated set: [title, year, slug, directors[]]
const CURATED = [
  ["Fight Club", 1999, "fight-club-1999", ["Fincher"]],
  ["Interstellar", 2014, "interstellar-2014", ["Nolan"]],
  ["When Harry Met Sally", 1989, "when-harry-met-sally-1989", ["Reiner"]],
  ["The Wolf of Wall Street", 2013, "the-wolf-of-wall-street-2013", ["Scorsese"]],
  ["Kill Bill: Volume 1", 2003, "kill-bill-vol-1-2003", ["Tarantino"]],
  ["Whiplash", 2014, "whiplash-2014", []],
  ["American Beauty", 1999, "american-beauty-1999", []],
  ["The Truman Show", 1998, "the-truman-show-1998", []],
  ["Dead Poets Society", 1989, "dead-poets-society-1989", []],
  ["There Will Be Blood", 2007, "there-will-be-blood-2007", ["Anderson"]],
  ["Se7en", 1995, "se7en-1995", ["Fincher"]],
  ["Eternal Sunshine of the Spotless Mind", 2004, "eternal-sunshine-of-the-spotless-mind-2004", []],
  ["La La Land", 2016, "la-la-land-2016", []],
  ["The Shawshank Redemption", 1994, "the-shawshank-redemption-1994", ["Darabont"]],
  ["WALL-E", 2008, "wall-e-2008", []],
  ["Schindler’s List", 1993, "schindlers-list-1993", ["Spielberg"]],
  ["Forrest Gump", 1994, "forrest-gump-1994", []],
  ["Shutter Island", 2010, "shutter-island-2010", ["Scorsese"]],
  ["Good Will Hunting", 1997, "good-will-hunting-1997", []],
  ["500 Days of Summer", 2009, "500-days-of-summer-2009", []],
  ["Black Swan", 2010, "black-swan-2010", []],
  ["Groundhog Day", 1993, "groundhog-day-1993", []],
  ["The Matrix", 1999, "the-matrix-1999", ["Wachowski"]],
  ["The Lion King", 1994, "the-lion-king-1994", []],
  ["The Grand Budapest Hotel", 2014, "the-grand-budapest-hotel-2014", ["Wes Anderson"]],
  ["Get Out", 2017, "get-out-2017", ["Peele"]],
];

// Real theatrical runtimes (minutes) for the curated set. The chart's
// default minute estimate is token_count / 250, which is fine for an
// unknown film but drifts up to ~50% off real runtime for some titles
// (Grand Budapest, Schindler's List, Interstellar). When the loaded film is
// in this table, the chart uses the real runtime instead so the minute
// labels under the connectors match what the audience actually saw.
const RUNTIMES = {
  "fight-club-1999": 139,
  "interstellar-2014": 169,
  "when-harry-met-sally-1989": 95,
  "the-wolf-of-wall-street-2013": 180,
  "kill-bill-vol-1-2003": 111,
  "whiplash-2014": 107,
  "american-beauty-1999": 122,
  "the-truman-show-1998": 103,
  "dead-poets-society-1989": 128,
  "there-will-be-blood-2007": 158,
  "se7en-1995": 127,
  "eternal-sunshine-of-the-spotless-mind-2004": 108,
  "la-la-land-2016": 128,
  "the-shawshank-redemption-1994": 142,
  "wall-e-2008": 98,
  "schindlers-list-1993": 195,
  "forrest-gump-1994": 142,
  "shutter-island-2010": 138,
  "good-will-hunting-1997": 126,
  "500-days-of-summer-2009": 95,
  "black-swan-2010": 108,
  "groundhog-day-1993": 101,
  "the-matrix-1999": 136,
  "the-lion-king-1994": 88,
  "the-grand-budapest-hotel-2014": 99,
  "get-out-2017": 104,
};

// Hand-written notes per turning point. Each list is ordered left-to-right
// by position on the chart, matching the extrema the intro chart computes
// from the 20-point arc. One decisive sentence per beat.
// Scene GIFs per turning point. Index in the array matches the extremum
// index (left-to-right by position on the chart). Use null to skip a
// turning point that has no GIF yet — the tooltip will just show the note.
// To remap, change which file lives at which array slot.
const SCENE_GIFS = {
  "interstellar-2014": [
    "timeline-scenes/interstellar_1.mp4",  // 0   ~17m  trough  Dust patterns
    "timeline-scenes/interstellar_2.mp4",  // 1   ~25m  peak    NASA reveal
    "timeline-scenes/interstellar_3.mp4",  // 2   ~34m  trough  Goodbye to Murph
    "timeline-scenes/interstellar_4.mp4",  // 3   ~42m  peak    Endurance launches
    "timeline-scenes/interstellar_5.mp4",  // 4   ~59m  trough  Approaching Miller's
    "timeline-scenes/interstellar_6.mp4",  // 5   ~68m  peak    Boots in shallow water
    "timeline-scenes/interstellar_7.mp4",  // 6   ~84m  trough  The wave / Doyle
    "timeline-scenes/interstellar_8.mp4",  // 7   ~93m  peak    Messages from Murph + Tom
    "timeline-scenes/interstellar_9.mp4",  // 8   ~101m trough  Brand pleads for Edmunds'
    "timeline-scenes/interstellar_10.mp4", // 9   ~110m peak    Mann waking up
    "timeline-scenes/interstellar_11.mp4", // 10  ~118m trough  Mann betrays on the ice
    "timeline-scenes/interstellar_12.mp4", // 11  ~127m peak    Mann's bad docking
    "timeline-scenes/interstellar_13.mp4", // 12  ~135m trough  Cooper detaches
    "timeline-scenes/interstellar_14.mp4", // 13  ~144m peak    Inside the tesseract
    "timeline-scenes/interstellar_15.mp4", // 14  ~152m trough  Watch into binary
  ],
};

const NOTES = {
  "fight-club-1999": [
    "Marla disrupts the support groups. The narrator can't sleep again.",
    "First fight in the parking lot of Lou's Tavern. Tyler swings, he swings back.",
    "Tyler bringing the lye out of the closet. Soap-making in the kitchen.",
    "The lye burn on the back of his hand. Stay with the pain. Don't shut this out.",
    "Marla in the bath. The narrator caught between her and Tyler.",
    "Project Mayhem recruits sleeping in the lawn. The first homework assignments.",
    "Bob's death on the operation. His name was Robert Paulson.",
    "Driving city to city, finding fight clubs in basements he never set up.",
    "Hotel room. Marla on the phone. The pieces start to fit. Tyler is the narrator.",
  ],
  "interstellar-2014": [
    "Dust drifting onto Murph's bedroom floor in patterns. Cooper crouches and reads them.",
    "NASA's hidden facility. Brand laying out the Lazarus mission.",
    "Goodbye to Murph. The truck pulls away with the watch on the seat.",
    "Endurance launches and docks with the spinning ring.",
    "Approaching Miller's planet. The time-dilation cost spelled out.",
    "Boots in the shallow water of Miller's planet, the horizon a perfect plane.",
    "The wave. Doyle is gone. Twenty-three years on Earth eaten by an hour on this rock.",
    "Cooper alone in the cabin watching messages from Murph and Tom that piled up.",
    "Brand pleading for Edmunds' planet. The crew chooses Mann instead.",
    "Mann waking out of cryosleep, weeping into Cooper's shoulder.",
    "Mann's helmet visor cracking on the ice. The data was a lie.",
    "Mann's bad docking blows up the ring. The Endurance survives, barely.",
    "Cooper preparing to detach and slingshot into Gargantua.",
    "Cooper inside the tesseract. Murph's bookshelf as a wall of moments he can reach.",
    "Tapping the watch's second hand into binary. The data Murph will solve years from now.",
  ],
  "when-harry-met-sally-1989": [
    "Chicago to New York drive after graduation. Harry's grim theory that men and women can't be friends.",
    "Airport, five years later. Harry engaged to Helen, Sally with Joe. The conversation goes nowhere.",
    "Bookstore, five years after that. Harry divorced. Sally broken up with Joe. This time they actually talk.",
    "Split-screen phone calls late at night, both of them watching Casablanca in bed.",
    "Katz's deli. Sally faking an orgasm at the table. I'll have what she's having.",
    "Setting up Marie and Jess and watching it click for the two of them instead.",
    "Sally dragging a Christmas tree home through the snow. On the phone with Harry.",
    "New Year's Eve as friends. The countdown, the awkward kiss, the line starting to bend.",
    "Sally's crying call that Joe is getting married. Harry comes over. They sleep together.",
    "Morning after. Harry pulling back. Sally watching him get dressed.",
    "Jess and Marie's wedding. The fight on the dance floor. Sally walking out.",
    "Weeks of phone tag. Answering machines on both ends of the apartment.",
    "Documentary couples on the couch through it all, telling their meet-cutes to the camera.",
    "New Year's Eve again. Sally alone at the party. Harry alone in the streets.",
    "Harry running across the city to find her. The list of small things he loves about her.",
  ],
  "the-wolf-of-wall-street-2013": [
    "Naomi confronting Jordan over an affair. The first crack in the marriage.",
    "Stratton Oakmont peak hedonism. Cocaine, marching bands, chimpanzees in the office.",
    "FBI agents on the yacht trying to flip Jordan over a deli sandwich.",
    "Steve Madden IPO. Stratton makes him richer than he was the day before.",
    "Lemmon-714 quaalude meltdown. Crawling to the white Lamborghini.",
    "Geneva Swiss bank scheme. The brief delusion that he can outrun it.",
    "FBI raid on the Stratton Oakmont sales floor. Phones still ringing as agents walk in.",
  ],
  "kill-bill-vol-1-2003": [
    "The Bride wakes from the coma and pulls the mosquito off her thigh.",
    "Vernita Green dies in the kitchen with the daughter watching from the doorway.",
    "Wedding chapel flashback. The Deadly Vipers walk in. The world goes white.",
    "Hattori Hanzo agrees to make her one more sword.",
    "O-Ren Ishii's anime origin. The childhood massacre under the bed.",
    "House of Blue Leaves entrance. The Crazy 88 step out and the killing starts.",
    "Gogo Yubari's mace and the long fight that ends with her on the floor.",
    "O-Ren defeated in the snow garden. Apology accepted.",
  ],
  "whiplash-2014": [
    "Andrew first sees Fletcher's class through the studio doorway.",
    "Andrew gets called up. Promoted to the core band as alternate.",
    "Fletcher's rushing-or-dragging tirade. The chair flies past his head.",
    "Family dinner. Pride about Carnegie. Bench-pressed by his cousin's college stories.",
    "Loses his folder right before the competition. Demoted on the spot.",
    "Wins the chair back at audition by playing past blood.",
    "The bus breakdown and the car crash. Crawling to the stage covered in blood.",
    "JVC Festival. Caravan solo. The band scrambling to keep up with him.",
    "Mid-Caravan. Andrew locking eyes with Fletcher across the kit, daring him to keep going.",
  ],
  "american-beauty-1999": [
    "Lester sees Angela cheering at the basketball game. Roses bloom in the air.",
    "Family dinner. Carolyn's brittle politeness. Jane staring at the table.",
    "Lester quits, blackmails his boss, buys the muscle car.",
    "Carolyn at the shooting range learning to fire a pistol.",
    "Lester driving with the windows down, music up, free.",
    "Frank Fitts beating Ricky in the bedroom over a misread tape.",
    "Lester smoking with Ricky in the garage. Easy laughter between them.",
    "Frank kisses Lester in the rain. Lester refuses. Frank goes home cracked.",
    "Angela in the kitchen. Lester realizes she is a virgin and puts his coat around her.",
    "The gunshot. Lester's last reflective monologue over the photograph.",
  ],
  "the-truman-show-1998": [
    "The car radio briefly broadcasts the production crew tracking Truman's drive.",
    "Truman's morning routine. Good morning, good afternoon, good evening to the neighbor.",
    "His long-dead father walking past on a bus. The crew drags the man offscreen.",
    "Truman briefly reunited with his manufactured father in the park.",
    "Travel agent's office. Posters warning Truman about every disaster abroad.",
    "Truman commandeering the sailboat. Heading toward the horizon.",
    "Storm escalating. Christof pushing the weather from the studio control booth.",
  ],
  "dead-poets-society-1989": [
    "Welton's strict opening assembly. Tradition, honor, discipline, excellence.",
    "Keating's first class. Carpe diem. Rip the page out of the book.",
    "Boys' restless dorm at night. Whiskey and bravado.",
    "First cave meeting. The poems read aloud by candlelight.",
    "Mr. Perry pulling Neil from the play. Neil ending his own life with the pistol.",
    "The boys grieving in the dorm together the morning after.",
    "Cameron rats them out under pressure from the headmaster.",
    "Keating finds the contract on his desk. He is fired.",
    "O Captain my Captain. The boys stand on their desks as Keating walks out.",
  ],
  "there-will-be-blood-2007": [
    "Silver mine accident. Plainview drags himself across the desert with a broken leg.",
    "H.W. as a baby on the train. The early oil-strike montage.",
    "Pitching to the Sundays in California. Quiet suspicion across the table.",
    "Little Boston gusher. The derrick burns into the night.",
    "The explosion that takes H.W.'s hearing. Plainview holds him on the ground.",
    "Henry arriving at the door claiming to be his brother.",
    "Plainview executes the imposter Henry beside the lake.",
    "Bowling-alley reckoning with Eli. I drink your milkshake. The pin slamming down.",
  ],
  "se7en-1995": [
    "Gluttony. The fat man face-down in spaghetti at the kitchen table.",
    "Mills and Tracy at dinner. The first warm scene in the film.",
    "Greed. Eli Gould's law office, blood on the carpet spelling the word.",
    "Library research montage. Somerset chasing Dante through the stacks.",
    "Sloth. The body strapped to the bed turns out to be alive.",
    "John Doe walks into the precinct covered in blood and surrenders.",
    "Doe leading them out into the desert under the helicopter.",
    "Tense drive. Somerset uneasy. Mills uncertain.",
    "What's in the box. Doe wins. Mills pulls the trigger.",
  ],
  "eternal-sunshine-of-the-spotless-mind-2004": [
    "Joel meets Clementine on the Montauk train. An easy first conversation.",
    "Joel finds out Clementine has erased him. He goes to Lacuna to do the same.",
    "First erased memories together. The bookstore. Late dinners.",
    "Old fights coming up. Cruelty being deleted along with everything else.",
    "Younger memories. Kissing on the frozen Charles. The elephant parade.",
    "Joel hides her in the childhood memory of the kitchen. Lacuna finds them anyway.",
    "Hides her in the shame memory under the bed. The kid bullies coming for the dead bird.",
    "The beach house collapsing around them. Meet me in Montauk.",
    "Tapes from Lacuna playing back. Joel and Clementine hearing their own cruelty for the first time.",
  ],
  "la-la-land-2016": [
    "Another Day of Sun on the freeway off-ramp.",
    "Mia's bad audition cut off mid-monologue.",
    "A Lovely Night dance up in the hills above the city.",
    "Mia returning to her boyfriend's dinner. Sebastian alone at the bar.",
    "Planetarium. The waltz floating up among the stars.",
    "One-man-show fight at the dinner table. Mia drives back home alone.",
    "The Audition. Here's to the ones who dream. Sebastian drives her up to the callback.",
    "Inside the imagined alternate life. The version of their story where they stayed together.",
  ],
  "the-shawshank-redemption-1994": [
    "The courtroom. Andy convicted of murdering his wife and her lover.",
    "Andy approaching Red on the yard. The rock hammer ordered through the underground.",
    "The Sisters cornering Andy in the projection booth. The infirmary aftermath.",
    "Roof tarring in the warm sun. Three cold beers per man on Andy's tab.",
    "Bogs broken by Hadley's club. The Sisters never touch Andy again.",
    "Andy locks the warden's office and plays Mozart over the loudspeakers.",
    "Andy demanding a retrial. Warden Norton sends him to solitary instead.",
  ],
  "wall-e-2008": [
    "WALL-E's daily routine. The cockroach. The cassette tape. Hello, Dolly.",
    "EVE arrives. WALL-E hides behind a rock as her scanners sweep the dust.",
    "WALL-E showing EVE the lighter, the bra, the things he has saved.",
    "EVE shuts down the second she sees the plant. The mothership leaves with her.",
    "Aboard the Axiom. Fire-extinguisher dance through space outside the ship.",
    "AUTO's mutiny. The captain restrained on the bridge.",
    "Captain learning what Earth used to look like. The first stand against AUTO.",
    "WALL-E crushed under the holo-detector trying to hold it open.",
    "Plant goes in. Ship turns home. EVE rebooting WALL-E in the truck on Earth.",
  ],
  "schindlers-list-1993": [
    "Krakow ghetto established. Suitcases on the cobblestones.",
    "The enamelware factory thriving. Stern running the office.",
    "The one-armed worker shot in the snow.",
    "Stern handing Schindler the lists. Names being saved on paper.",
    "Liquidation of the ghetto. The girl in the red coat moving through the chaos.",
    "Brief saved-worker moments. A woman handed back her ring.",
    "Plaszow. Goeth on the balcony with the rifle picking off prisoners.",
    "Schindler's birthday party. The kiss with the Jewish girl on the dance floor.",
    "Train to Auschwitz. The women diverted. The shower room.",
    "It is water, not gas. The doors open and they are alive.",
    "End of the war. Schindler's letter read aloud to the assembled workers.",
    "Workers presenting Schindler the gold ring. He weeps about the ones he could have saved.",
  ],
  "forrest-gump-1994": [
    "Young Forrest in leg braces. The bullies on bikes. Run, Forrest, run.",
    "College football. Bear Bryant on the sideline.",
    "Vietnam deployment. Bubba talking shrimp the whole way over.",
    "Forrest carrying men out of the jungle one at a time. Saving Lieutenant Dan.",
    "Bubba dying in the rain at the river.",
    "Ping pong in the army hospital. Meeting Jenny again on the Mall.",
    "Mama dying of cancer at home. Forrest at her bedside.",
    "Lieutenant Dan on the shrimp boat. The hurricane that makes them rich.",
    "Jenny on the balcony of the Watergate apartment, wrecked, ready to jump.",
    "Forrest running back and forth across the country, beard down to his chest.",
    "Jenny showing Forrest his son for the first time.",
    "Forrest and Jenny marrying on the porch under the tree.",
    "Jenny's grave. Forrest standing in the rain talking to her.",
  ],
  "shutter-island-2010": [
    "The ferry out of Boston. Teddy and Chuck arriving on the island.",
    "Cawley's office. Rachel Solando missing from a locked room.",
    "Interviewing staff and patients across the wards.",
    "Teddy's migraine attack. The vision of his wife in the ash.",
    "Closing in on what looks like a real lead at the cliffs.",
    "Cliff cave. Rachel-the-doctor warning him about the lighthouse.",
    "Climbing back up to Cawley's house. The storm passing.",
    "Approach to the lighthouse across the wet rocks.",
    "Cawley waiting at the top of the lighthouse stairs.",
    "Andrew Laeddis is him. The wife. The children at the lake.",
    "The role-play remembrance. He says her name. He remembers what he did.",
    "Lighthouse top. Cawley laying out the truth Andrew has been refusing to remember.",
  ],
  "good-will-hunting-1997": [
    "Will at the bar. The fight. The arrest.",
    "Lambeau finds the math problem solved on the chalkboard outside his class.",
    "First disastrous session with the priest, with the hypnotist, then with Sean.",
    "The park bench. Sean's monologue about love and the Sistine Chapel.",
    "Will's deflection. The first big fight with Skylar in her dorm room.",
    "Will and Skylar in bed. I love you. The first time he says it.",
    "Sean and Will in the office. The abuse confession. It's not your fault.",
    "Sean and Lambeau arguing in the hallway about Will's future.",
    "Skylar gone to Stanford. Will alone in the apartment with the file.",
  ],
  "500-days-of-summer-2009": [
    "Day 1. The elevator. The Smiths on the headphones.",
    "Karaoke. First kiss in the office copy room.",
    "What are we. Tom asking. Summer not answering.",
    "IKEA, the record store, dancing in the park. Hall and Oates on the way to work.",
    "Pancake house. Summer ending it across the table.",
    "Friend's wedding. Tom and Summer on the train back.",
    "Rooftop party. Expectations on the left, reality on the right.",
    "Tom's downward montage. Whiskey and Twinkies on the couch.",
    "Park bench reveal. Summer is engaged. Tom alone on the wooden slats.",
  ],
  "black-swan-2010": [
    "Audition for Swan Lake. Thomas pulling Nina aside.",
    "Cast as the Swan Queen. Champagne in the apartment with mother.",
    "Mother smothering Nina at home. Mirrors starting to crack.",
    "Lily showing up in the company. Clubbing, the pill, the night out.",
    "Backstage hallucinations. The reflection moving without her.",
    "Lily and Nina in bed in the small room. The release.",
    "Beth in the hospital with the mirror shard. Mother locking Nina in her bedroom.",
    "The Black Swan dance. Nina becoming the role under the spotlight, mirror shard hidden in her costume.",
  ],
  "groundhog-day-1993": [
    "Phil stuck in Punxsutawney. The clock radio. I Got You Babe.",
    "Bowling alley philosophizing. Beer with the locals.",
    "Robbing the armored car. The nihilism phase.",
    "Gluttony at the diner. Rita watching him eat the whole table.",
    "Suicide attempts. Toaster in the bathtub. Off the clocktower.",
    "Self improvement. Piano lessons. French. Ice sculpting in the park.",
    "Despite everything Rita rejects him on the bench. God this is awful.",
    "Saving the boy from the tree. The flat tire. The Heimlich at the steakhouse.",
    "The bachelor auction. Spring at last in the bed and breakfast.",
  ],
  "the-matrix-1999": [
    "The bug implant. Smith interrogating Neo across the desk.",
    "Red pill chosen. The mirror reaches for him.",
    "Body wakes in the goo. Flushed down the chute.",
    "Crew of the Nebuchadnezzar. The dojo training program.",
    "The desert of the real. The construct outside the window.",
    "Loadup gun montage. We need guns. Lots of guns.",
    "Cypher's betrayal. Pulling the plug on Switch and Apoc.",
    "Lobby shootout. Rescue Morpheus from the rooftop.",
    "Subway platform with Smith. Neo standing on the tracks as the freight train roars in.",
  ],
  "the-lion-king-1994": [
    "Mufasa scolds Simba about the elephant graveyard.",
    "I Just Can't Wait to Be King. Simba and Nala bouncing through animals.",
    "Wildebeest stampede. Mufasa goes off the cliff. Scar at the top.",
    "Timon and Pumbaa rescue. Hakuna Matata in the jungle pool.",
    "Nala finding Simba grown up. Pinning him in the leaves.",
    "Can You Feel the Love Tonight. The waterfall.",
    "Simba and Nala fighting about going back. He runs.",
    "Rafiki at the pool. Mufasa in the clouds. Remember who you are.",
    "Simba returning to Pride Rock. The land black and dead.",
    "Pride Rock at night. Simba and Scar at the cliff's edge.",
  ],
  "the-grand-budapest-hotel-2014": [
    "Madame D's last visit to the hotel. The quiet goodbye in her suite.",
    "Madame D's will. Boy with Apple bequeathed to Gustave.",
    "Prison. Gustave with the inmates at the long table.",
    "Prison breakout. Pastry tools smuggled inside Mendl's boxes.",
    "Society of the Crossed Keys. Concierge phone tree across half of Europe.",
    "Mountaintop monastery. Serge's whispered confession in the cell.",
    "Serge murdered offscreen by Jopling. The ski-and-toboggan chase down the mountain.",
    "Returning to a hotel half-occupied by Zubrowka soldiers.",
    "Train compartment. Soldiers checking papers. Gustave shot offscreen on the platform.",
    "Older Mr. Moustafa across the dinner table from the Author. The hotel as it used to be.",
  ],
  "get-out-2017": [
    "Banter with Rod in the kitchen. The car ride out to the country.",
    "Hit the deer on the road. The cop asking for Chris's ID.",
    "Friendly arrival at the Armitage house. Hugs on the porch.",
    "First weird Georgina. Walter running through the dark on the lawn.",
    "Family-introduction dinner. Dean's I-would-have-voted-for-Obama-a-third-time.",
    "Missy's hypnosis. The teacup. The sunken place.",
    "Morning after. Chris brushing it off as a bad night.",
    "Garden party. Silent auction with bingo cards. Dean bidding on Chris.",
    "Andre at the party. Chris realizes he is Logan King.",
    "Captured. The TV reveal. The Coagula procedure explained.",
    "Escape. Cotton stuffed in the ears. Rod arriving in the TSA car.",
  ],
};

// ─────────────────────────────────────────────────────────
// Tonight's film: random pick from CURATED, used by hero + intro scrolly.
const tonight = { slug: null, arc: null, reversals: null };
// Cached reversals.json — fetched once at boot, reused on every shuffle so
// shuffles don't pay the network + parse cost repeatedly.
let reversalsAll = null;
async function getReversalsAll() {
  if (!reversalsAll) reversalsAll = await d3.json(`${DATA}/reversals.json`);
  return reversalsAll;
}

// Resolve a slug to its display title — prefers the curated label (e.g.
// "Kill Bill: Volume 1") over the corpus form ("Kill Bill Vol 1") that lives
// in the arc JSON. Falls back to prettyTitle(arcTitle) when the slug isn't
// curated.
function curatedTitleForSlug(slug, arcTitle) {
  const hit = CURATED.find(c => c[2] === slug);
  return hit ? hit[0] : prettyTitle(arcTitle);
}

async function pickTonightsFilm() {
  const pool = CURATED.map(c => c[2]);
  tonight.slug = pool[Math.floor(Math.random() * pool.length)];
  seenSlugs.add(tonight.slug);
  tonight.arc = await d3.json(`${DATA}/arcs/${tonight.slug}_arc.json`);
  const revAll = await getReversalsAll();
  tonight.reversals = revAll.find(r => r.slug === tonight.slug);
}

// ─────────────────────────────────────────────────────────
// HERO
function measure(el) {
  const r = el.getBoundingClientRect();
  return { w: Math.max(r.width, 320), h: Math.max(r.height, 240) };
}

// One bold zero baseline (the "plane" the line sits on), BEGIN/END anchored
// to that baseline, and rotated POSITIVE / NEGATIVE labels on the far left
// edge — out of the way of any annotations or busy chart areas.
function drawAxisFrame(svg, { x, y, x0, x1, withYSides = true, ySide = "left", withEndLabels = true } = {}) {
  // prominent zero baseline
  svg.append("line")
    .attr("class", "y-zero")
    .attr("x1", x0).attr("x2", x1)
    .attr("y1", y(0)).attr("y2", y(0))
    .attr("stroke", "#9aa18d")
    .attr("stroke-width", 1.4)
    .attr("stroke-opacity", 0.7);

  // BEGIN / END at the baseline endpoints — anchored to where the line
  // begins and ends, not at chart corners that get covered by overlay text.
  if (withEndLabels) {
    svg.append("text").attr("class", "axis-end")
      .attr("x", x0).attr("y", y(0) + 18)
      .attr("text-anchor", "start")
      .text("BEGINNING");
    svg.append("text").attr("class", "axis-end")
      .attr("x", x1).attr("y", y(0) + 18)
      .attr("text-anchor", "end")
      .text("END");
  }

  // POSITIVE / NEGATIVE — horizontal labels at the top and bottom of the plot
  // area. ySide picks left or right anchoring.
  if (withYSides) {
    const topPx = y.range()[1];
    const botPx = y.range()[0];
    const onRight = ySide === "right";
    const xLab = onRight ? x1 : x0;
    const anchor = onRight ? "end" : "start";
    svg.append("text").attr("class", "axis-y-side")
      .attr("x", xLab).attr("y", topPx - 8)
      .attr("text-anchor", anchor)
      .text("POSITIVE :)");
    svg.append("text").attr("class", "axis-y-side")
      .attr("x", xLab).attr("y", botPx + 18)
      .attr("text-anchor", anchor)
      .text("NEGATIVE :(");
  }
}

// Render the hero arc path. Idempotent — clears any previous path first so it
// can be called both at boot and on a reshuffle.
function renderHeroArc() {
  if (!tonight.arc) return;
  const svg = d3.select(".hero-arc");
  svg.selectAll("path").remove();

  const { w, h } = measure(svg.node().parentNode);
  svg.attr("viewBox", `0 0 ${w} ${h}`).attr("preserveAspectRatio", "none");

  const pad = 80;
  const ys = tonight.arc.main_arc.map(p => p.z_score);
  const yExt = d3.extent(ys);
  const x = d3.scaleLinear().domain([0, 1]).range([pad, w - pad]);
  const y = d3.scaleLinear().domain([yExt[0] - 0.5, yExt[1] + 0.5]).range([h - pad, pad]);
  const lineFn = d3.line()
    .x((_, i, a) => x(i / (a.length - 1)))
    .y(d => y(d))
    .curve(d3.curveCatmullRom.alpha(0.6));

  const path = svg.append("path")
    .datum(ys)
    .attr("d", lineFn)
    .attr("fill", "none")
    .attr("stroke", C.ink)
    .attr("stroke-width", 2)
    .attr("stroke-linecap", "round")
    .attr("vector-effect", "non-scaling-stroke");

  const total = path.node().getTotalLength();
  path.attr("stroke-dasharray", `${total} ${total}`)
      .attr("stroke-dashoffset", total);

  if (window.gsap) {
    gsap.to(path.node(), {
      strokeDashoffset: 0,
      duration: 2.4,
      ease: "power2.inOut",
      delay: 0.2,
    });
  }
}

// Render the "tonight's film" label content.
function renderHeroLabel() {
  const label = document.querySelector("#hero-film");
  if (!label || !tonight.arc) return;
  label.innerHTML =
    `<span class="hero-film-key">tonight’s film</span>` +
    `<span class="hero-film-val"><em>${curatedTitleForSlug(tonight.slug, tonight.arc.title)}</em> (${tonight.arc.year})</span>`;
}

// Sync the intro-prelude headline scramble target to the current film title.
// The chars pool is the title's OWN letters (data-scramble-chars), so during
// the scramble each random character has a width close to the final text —
// keeps the headline stable at the same line count instead of flickering
// between 2 and 3 lines as wide-vs-narrow random chars are picked.
function renderIntroPreludeLabels({ animate = false } = {}) {
  if (!tonight.arc) return;
  const titleEl = document.getElementById("intro-prelude-title");
  if (!titleEl) return;
  const t = curatedTitleForSlug(tonight.slug, tonight.arc.title);
  // Build the scramble pool from the title's own letters PLUS a small set of
  // common letters so ScrambleText has enough variety to avoid leaving any
  // edge-case residual character in unusually short titles.
  const titleLetters = t.replace(/\s+/g, "");
  const charsPool = (titleLetters + "abcdefghijklmnoprstu") || "lowerCase";
  titleEl.dataset.final = t;
  titleEl.dataset.scrambleChars = charsPool;
  if (animate && window.gsap && window.ScrambleTextPlugin) {
    // Kill any in-flight scramble on this element so a rapid second click
    // can't leave orphan characters from the previous chars pool. Also
    // blank the textContent for a clean scramble start.
    gsap.killTweensOf(titleEl);
    titleEl.textContent = "";
    gsap.to(titleEl, {
      duration: 1.1,
      scrambleText: {
        text: t,
        chars: charsPool,
        revealDelay: 0.25,
        speed: 0.45,
        tweenLength: false,
      },
      ease: "none",
    });
  } else {
    titleEl.textContent = t;
  }
}

// Pick a different film from the curated set and re-render hero arc, label,
// and intro pin. Triggered by the "Haven't seen, give me another" button.
//
// The scramble + label updates fire IMMEDIATELY using the title we already
// have in CURATED — we don't wait for the arc fetch, so the user gets a
// smooth, responsive flicker the moment they click. The heavy redraw work
// is deferred to the next animation frame so it doesn't block the scramble.
//
// reshuffleGen is a monotonic counter so a stale fetch from a previous click
// can't apply its arc data after a newer click has already moved on. Without
// this, rapid double-clicks could trigger two redraws and lock the scramble
// mid-animation while the second relayout blocks the main thread.
let reshuffleGen = 0;
// Films the user has already been shown across the warm-up section. Initial
// pickTonightsFilm seeds it; each reshuffle adds the new slug. Once the user
// has cycled through all 24 curated films, the set resets so the loop can
// continue.
const seenSlugs = new Set();
async function reshuffleFilm() {
  const oldSlug = tonight.slug;
  if (oldSlug) seenSlugs.add(oldSlug);
  const pool = CURATED.filter(c => c[2] !== oldSlug);
  if (!pool.length) return;

  // Prefer films the user hasn't seen yet. Only fall back to seen films when
  // every other curated title has been shown.
  let candidates = pool.filter(c => !seenSlugs.has(c[2]));
  if (candidates.length === 0) {
    seenSlugs.clear();
    if (oldSlug) seenSlugs.add(oldSlug);
    candidates = pool;
  }

  // Soft length bias — closer-in-length titles get more weight, but every
  // candidate keeps a non-zero chance so distant lengths can still come up.
  // weight = 1 / (1 + 0.5 * |Δlen|) — delta 0 → 1.0, delta 10 → 0.17, etc.
  const currentLen = (tonight.arc?.title || "").length;
  const weighted = candidates.map(c => ({
    c,
    w: 1 / (1 + 0.5 * Math.abs(c[0].length - currentLen)),
  }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  let pick = weighted[weighted.length - 1].c;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) { pick = x.c; break; }
  }
  const [nextTitle, nextYear, nextSlug] = pick;
  const gen = ++reshuffleGen;
  tonight.slug = nextSlug;

  // Fire the scramble + label updates with the title we already know. Stub
  // tonight.arc with the title so renderHeroLabel / renderIntroPreludeLabels
  // can paint without waiting on the arc JSON.
  const stubArc = { title: nextTitle, year: nextYear };
  tonight.arc = stubArc;
  renderHeroLabel();
  renderIntroPreludeLabels({ animate: true });
  const beatFilmEl = document.getElementById("intro-beat-film");
  if (beatFilmEl) beatFilmEl.textContent = nextTitle;

  // Now fetch the new arc (+ cached reversals) and redraw the heavy bits.
  let arc, reversals;
  try {
    arc = await d3.json(`${DATA}/arcs/${nextSlug}_arc.json`);
    const revAll = await getReversalsAll();
    reversals = revAll.find(r => r.slug === nextSlug);
  } catch (err) {
    console.error("[reshuffle] failed:", err);
    return;
  }
  // Bail if a newer shuffle has fired in the meantime — that click's data is
  // the truth now, this one is stale.
  if (gen !== reshuffleGen) return;
  tonight.arc = arc;
  tonight.reversals = reversals;

  // Defer to the next frame so the scramble animation gets its own paint
  // before the synchronous redraw + dot-snap work runs.
  requestAnimationFrame(() => {
    if (gen !== reshuffleGen) return;  // a newer shuffle landed first
    renderHeroArc();
    if (intro.relayout) intro.relayout();
  });
}

let heroSetupDone = false;

async function drawHero() {
  if (!tonight.arc) { console.warn("[hero] no tonight.arc — skipping"); return; }
  renderHeroArc();
  renderHeroLabel();
  if (heroSetupDone) return;
  heroSetupDone = true;

  if (window.gsap) {
    if (window.ScrollTrigger) {
      // Fade the whole hero out by ~70% of its scroll, so by the time the
      // user is approaching vonnegut-1, hero is visually gone — no more
      // "two sections in the same frame" feeling.
      gsap.to(".hero-arc", {
        opacity: 0, y: -80,
        scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true }
      });
      gsap.to(".hero-inner", {
        y: -80, opacity: 0,
        scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true }
      });
      // Hero film label — one-shot scroll fade (initial opacity is 0 in CSS).
      // fromTo with immediateRender:false keeps it hidden until triggered.
      gsap.fromTo(".hero-film",
        { opacity: 1, y: 0 },
        {
          opacity: 0, y: -20, duration: 0.4, ease: "power2.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: ".hero",
            start: "55% top",
            toggleActions: "play none none reverse",
          },
        }
      );
      // Reveal label as the hero arc nears completion of its draw.
      gsap.to(".hero-film", { opacity: 1, duration: 0.8, ease: "power2.out", delay: 2.0 });

      // Reveal the scroll arrow AFTER the hero entrance settles.
      const hint = document.querySelector(".scroll-hint");
      if (hint) gsap.delayedCall(2.0, () => hint.classList.add("is-revealed"));

      // First-scroll handler dismisses the scroll arrow — single-fire.
      const onFirstScroll = () => {
        if (window.scrollY < 4) return;
        if (hint) {
          hint.classList.add("is-dismissed");
          setTimeout(() => hint.remove(), 500);
        }
        window.removeEventListener("scroll", onFirstScroll);
      };
      window.addEventListener("scroll", onFirstScroll, { passive: true });
    }
  }

  // Wire the shuffle button.
  const shuffleBtn = document.getElementById("hero-shuffle");
  if (shuffleBtn) shuffleBtn.addEventListener("click", reshuffleFilm);
}

// ─────────────────────────────────────────────────────────
// INTRO PIN — full-bleed, scroll-scrubbed scene with two floating beats.
// The arc draws as you scroll the first segment, beat copy fades, dashed
// connectors "boop boop boop" in sequence after the line is drawn.
const intro = { arc: null, reversals: null };

// Decide whether each beat should sit in the top half or bottom half of the
// stage based on where the arc passes through the LEFT region (both beats
// are anchored to the left edge of the stage). Keeps the copy from sitting
// on top of the line.
function placeIntroBeats(ys, yScale) {
  const stagePxMid = (yScale.range()[1] + yScale.range()[0]) / 2;

  // Both beats live at left: var(--gutter), so we use the LEFT third of the
  // arc as the avoidance zone for both. (When beat 1 is active, the entire
  // line is drawn and dots are armed — but the text still only collides with
  // the line in the left region of the stage where it sits.)
  const leftThird = ys.slice(0, Math.ceil(ys.length / 3));
  const leftAvgPx = leftThird.reduce((s, v) => s + yScale(v), 0) / leftThird.length;

  const place = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    if (leftAvgPx < stagePxMid) {
      // Line is in upper half here — push beat to lower half
      el.style.top = "auto";
      el.style.bottom = "12vh";
    } else {
      // Line is in lower half — beat goes upper
      el.style.top = "12vh";
      el.style.bottom = "auto";
    }
  };
  place('.intro-beat[data-beat="0"]');
  place('.intro-beat[data-beat="1"]');
}

function drawIntro() {
  if (!tonight.arc) { console.warn("[intro] no tonight.arc — skipping"); return; }
  const svg = d3.select(".intro-svg");
  const stage = svg.node().parentNode;

  function layoutAndDraw() {
    // Re-read tonight.arc / tonight.reversals on every layout so reshuffle
    // (which updates tonight.* and calls intro.relayout) sees the new film.
    // Capturing these once at drawIntro() time meant the chart always re-rendered
    // with the original film's arc data, no matter which slug was selected.
    const fc = tonight.arc;
    const revFc = tonight.reversals;
    intro.arc = fc;
    intro.reversals = revFc;

    const ref = document.querySelector("#intro-film-ref");
    const displayTitle = curatedTitleForSlug(tonight.slug, fc.title);
    if (ref) ref.textContent = displayTitle;
    const beatFilmEl = document.getElementById("intro-beat-film");
    if (beatFilmEl) beatFilmEl.textContent = displayTitle;

    const r = stage.getBoundingClientRect();
    const W = Math.max(r.width, 480);
    const H = Math.max(r.height, 360);
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "none");
    svg.selectAll("*").remove();

    const m = { top: 80, right: 80, bottom: 80, left: 80 };
    const ys = fc.main_arc.map(p => p.z_score);
    const xs = fc.main_arc.map(p => p.position);
    const yExt = d3.extent(ys);
    const yPad = 0.6;

    const x = d3.scaleLinear().domain([0, 1]).range([m.left, W - m.right]);
    const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([H - m.bottom, m.top]);

    drawAxisFrame(svg, { x, y, x0: m.left, x1: W - m.right, ySide: "right" });

    // Hide the axis elements so the scrub onUpdate can fade them in
    // sequentially (baseline → BEGIN/END → POSITIVE/NEGATIVE → beat 0 text).
    svg.select(".y-zero").style("opacity", 0);
    svg.selectAll(".axis-end").style("opacity", 0);
    svg.selectAll(".axis-y-side").style("opacity", 0);

    // Cache references for the per-frame onUpdate. layoutAndDraw can re-run
    // on resize, which removes + recreates these nodes — so cache fresh on
    // every layout instead of once at ScrollTrigger setup. Otherwise the
    // closure ends up holding detached nodes after any resize and BEGIN/END
    // (et al.) get stuck at opacity 0.
    intro.yZeroEl   = svg.select(".y-zero").node();
    intro.axisEnds  = svg.selectAll(".axis-end").nodes();
    intro.axisSides = svg.selectAll(".axis-y-side").nodes();

    const lineFn = d3.line()
      .x((_, i) => x(xs[i]))
      .y(d => y(d))
      .curve(d3.curveCatmullRom.alpha(0.6));

    // Runtime in minutes. Prefer the curated lookup (real theatrical
    // runtime) so the minute labels line up with the actual film. Fall
    // back to token-count heuristic (≈250 tokens per page, ≈1 page per
    // minute of screen time) for non-curated films, then 110 as a floor.
    const runtimeMin = RUNTIMES[tonight.slug]
      || (tonight.arc.token_count
        ? Math.max(60, Math.round(tonight.arc.token_count / 250))
        : 110);

    // Arc-to-baseline dashed connectors — one vertical dashed line per data
    // point, from the arc value down to y(0). They start collapsed at the
    // dot and animate sequentially via a TIME-BASED transition (not scrub)
    // once the line finishes drawing.
    const arcConnectors = svg.append("g").attr("class", "arc-connectors");
    const connectorData = ys.map((v, i) => {
      const isTurn = i > 0 && i < ys.length - 1 && (
        (ys[i] > ys[i - 1] && ys[i] > ys[i + 1]) ||
        (ys[i] < ys[i - 1] && ys[i] < ys[i + 1])
      );
      return {
        px: x(xs[i]),
        py: y(v),
        t: i / Math.max(1, ys.length - 1),
        isTurn,
      };
    });
    arcConnectors.selectAll("line")
      .data(connectorData)
      .join("line")
      .attr("x1", d => d.px).attr("x2", d => d.px)
      .attr("y1", d => d.py).attr("y2", d => d.py)  // collapsed at the dot
      .attr("stroke", C.inkDim)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2 4")
      .attr("opacity", 0)
      .attr("pointer-events", "none");
    intro.arcConnectors = arcConnectors;
    intro.connectorData = connectorData;
    intro.zeroY = y(0);

    // Minute labels — small mono numbers under each connector, on the same
    // baseline row as BEGIN / END. Endpoints are hidden so they don't crash
    // into BEGIN / END text.
    const minuteLabelsG = svg.append("g").attr("class", "intro-minute-labels");
    minuteLabelsG.selectAll("text")
      .data(connectorData)
      .join("text")
      .attr("x", d => d.px)
      .attr("y", y(0) + 36)            // separate row below BEGIN / END
      .attr("text-anchor", "middle")
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", 9)
      .attr("letter-spacing", "0.04em")
      .attr("fill", C.inkFaint)
      .attr("opacity", 0)
      .style("display", d => (d.t < 0.03 || d.t > 0.97) ? "none" : null)
      .text(d => `${Math.round(d.t * runtimeMin)}m`);
    intro.minuteLabelsG = minuteLabelsG;
    intro.connectorBooped = false;

    const path = svg.append("path")
      .attr("class", "intro-path")
      .datum(ys)
      .attr("d", lineFn)
      .attr("fill", "none")
      .attr("stroke", C.ink)
      .attr("stroke-width", 2.4);

    const total = path.node().getTotalLength();
    path.attr("stroke-dasharray", `${total} ${total}`)
        .attr("stroke-dashoffset", total);
    intro.path = path;
    intro.totalLen = total;

    // Turning-point dots. Hidden (r=0) until the line finishes drawing.
    const notes = NOTES[tonight.slug] || [];
    const sceneGifs = SCENE_GIFS[tonight.slug] || [];
    const dotsG = svg.append("g").attr("class", "intro-dots");
    // Tooltip — same style as the archetype-pin closest-15 hover tooltip:
    // Inter sans-serif 12px, ink, white-ish bg, faint rule border, padded.
    // Optionally shows a scene GIF above the note when SCENE_GIFS has one.
    const tooltip = svg.append("g").attr("class", "intro-tip").style("display", "none")
      .attr("pointer-events", "none");
    const tipBg = tooltip.append("rect").attr("fill", C.bg).attr("stroke", C.rule).attr("rx", 2);
    // Scene MP4 lives inside a foreignObject so we can use a real <video>
    // element (autoplay loop muted) — much lighter than equivalent GIFs.
    const tipFO = tooltip.append("foreignObject").style("display", "none");
    const tipVideo = tipFO.append("xhtml:video")
      .attr("autoplay", "").attr("loop", "").attr("muted", "")
      .attr("playsinline", "").attr("preload", "auto")
      .style("width", "100%").style("height", "100%")
      .style("object-fit", "cover").style("display", "block");
    // Browsers treat `muted` more reliably as a property than as an attribute.
    tipVideo.node().muted = true;
    const tipText = tooltip.append("text")
      .attr("font-family", "Inter, sans-serif")
      .attr("font-size", 12)
      .attr("fill", C.ink);
    // Scene GIFs are 400x250. Display at 240x150 inside the tooltip — small
    // enough to feel like an annotation, big enough to read.
    const TIP_IMG_W = 240, TIP_IMG_H = 150;
    // Tooltip text wrapping. SVG text doesn't wrap, so split the note into
    // words and stack them as tspans, breaking when the line would exceed
    // TIP_TEXT_MAX_W. Returns the number of lines so the box can size to it.
    const TIP_TEXT_MAX_W = 280;
    const TIP_LINE_H = 16;
    const wrapTipText = note => {
      tipText.text(null);
      const words = String(note).split(/\s+/).filter(Boolean);
      if (!words.length) return 0;
      let line = [];
      let tspan = tipText.append("tspan").attr("x", 0).attr("dy", 0).text("");
      let lineCount = 1;
      for (const word of words) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > TIP_TEXT_MAX_W && line.length > 1) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = tipText.append("tspan").attr("x", 0).attr("dy", TIP_LINE_H).text(word);
          lineCount++;
        }
      }
      return lineCount;
    };

    // Placeholder annotations for peak/trough hover — until real scene
    // notes are written into the NOTES table, the tooltip surfaces one of
    // these so the interaction shape is visible.
    const placeholderAnnotations = [
      "The page tightens. Dialogue narrows, the action accelerates.",
      "A reversal — what looked settled comes apart.",
      "Quiet beat. The character is alone with a consequence.",
      "The high point of the act. The room they’ve been moving toward.",
      "Crisis. Words run hot, scenes shorten.",
      "Pause. Someone says the unspoken thing.",
      "The trailer scene — big movement, big swing.",
      "A small triumph that the next page will undo.",
    ];

    // Compute local extrema (peaks and troughs) directly from the z_score
    // samples. These are the moments where the rendered arc visually turns —
    // exactly what an audience reads as a "turning point." Each entry holds
    // the data-space position/value plus a type tag for downstream styling
    // / annotation (peak vs. trough). Endpoints are excluded since they
    // don't have neighbors on both sides.
    const extrema = [];
    for (let i = 1; i < ys.length - 1; i++) {
      const isPeak   = ys[i] > ys[i - 1] && ys[i] > ys[i + 1];
      const isTrough = ys[i] < ys[i - 1] && ys[i] < ys[i + 1];
      if (isPeak || isTrough) {
        extrema.push({
          position: xs[i],
          value: ys[i],
          type: isPeak ? "peak" : "trough",
        });
      }
    }

    if (extrema.length) {
      // Snap each extremum onto the rendered Catmull-Rom curve so the dot
      // sits exactly on the line. The path is x-monotonic, so we binary-
      // search by length (~18 iterations) instead of sweeping hundreds of
      // samples — keeps shuffle responsive.
      const pathNode = path.node();
      const snapped = extrema.map(d => {
        const targetX = x(d.position);
        let lo = 0, hi = total;
        for (let i = 0; i < 18; i++) {
          const mid = (lo + hi) / 2;
          const p = pathNode.getPointAtLength(mid);
          if (p.x < targetX) lo = mid;
          else hi = mid;
        }
        const p = pathNode.getPointAtLength((lo + hi) / 2);
        return { cx: p.x, cy: p.y };
      });

      dotsG.selectAll("circle")
        .data(extrema)
        .join("circle")
        .attr("cx", (_, i) => snapped[i].cx).attr("cy", (_, i) => snapped[i].cy)
        .attr("r", 0)
        .attr("fill", C.amber)               // golden accent for both peaks and troughs
        .attr("stroke", C.bg).attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseenter", function (_, d) {
          const i = extrema.indexOf(d);
          d3.select(this).transition().duration(150).attr("r", 9);
          // NOTES is now indexed by extrema order (peak/trough) — the user
          // re-annotates against this stable list per slug. Falls back to
          // the placeholder copy until real notes are written.
          const note = notes[i] || placeholderAnnotations[i % placeholderAnnotations.length];
          const gifUrl = sceneGifs[i] || null;

          // Lay out text with word-wrap. Image (when present) sits above
          // the text. Box width is the wider of the image and the wrapped
          // text. Height stacks: padding + image + gap + line_count*line_h.
          const lineCount = wrapTipText(note);
          const bb = tipText.node().getBBox();
          const padX = 14, padY = 10;
          const gap = gifUrl ? 8 : 0;
          const textW = bb.width;
          const textH = lineCount * TIP_LINE_H;
          const innerW = gifUrl ? Math.max(TIP_IMG_W, textW) : textW;
          const innerH = (gifUrl ? TIP_IMG_H + gap : 0) + textH;
          const boxW = innerW + padX * 2;
          const boxH = innerH + padY * 2;

          // Anchor the tooltip beside the dot, flipping side / clamping to
          // chart bounds so it never escapes the visible area.
          const cx = snapped[i].cx, cy = snapped[i].cy;
          let tx = cx + 14;
          if (tx + boxW > W - 8) tx = cx - boxW - 14;
          tx = Math.max(8, tx);
          let ty = cy - boxH - 10;
          if (ty < 8) ty = cy + 14;

          tipBg.attr("x", tx).attr("y", ty)
            .attr("width", boxW).attr("height", boxH);

          // Position tspans at the tooltip's text origin. First line's
          // baseline sits at textY; subsequent tspans inherit dy stacking.
          const textX = tx + padX;
          const textY = (gifUrl ? ty + padY + TIP_IMG_H + gap : ty + padY) + 12;
          tipText.attr("x", textX).attr("y", textY);
          tipText.selectAll("tspan").attr("x", textX);

          if (gifUrl) {
            tipFO
              .attr("x", tx + padX + (innerW - TIP_IMG_W) / 2)
              .attr("y", ty + padY)
              .attr("width", TIP_IMG_W)
              .attr("height", TIP_IMG_H)
              .style("display", null);
            // Only swap src if changed; calling load() needlessly each hover
            // would restart the video from frame 1 and feel janky.
            const vNode = tipVideo.node();
            if (vNode.getAttribute("src") !== gifUrl) {
              vNode.setAttribute("src", gifUrl);
              vNode.load();
            }
            const p = vNode.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
          } else {
            tipFO.style("display", "none");
            tipVideo.node().pause();
          }
          tooltip.style("display", null);
        })
        .on("mouseleave", function () {
          d3.select(this).transition().duration(150).attr("r", 6);
          tooltip.style("display", "none");
        });
    }
    intro.dotsG = dotsG;
    intro.yScale = y;

    // Dynamic beat placement — push each beat into the half of the chart
    // (top or bottom) where the line ISN'T spending most of its time, so the
    // copy doesn't overlap the arc. Recomputed per layout (and per shuffle).
    placeIntroBeats(ys, y, m, H);

    // Reset the arm-state flag so the next onUpdate re-runs armDots against
    // the freshly-recreated dots. Without this, reshuffling while the user
    // is at beat 1 would leave the new dots invisible (r=0).
    if (intro._resetArmState) intro._resetArmState();
  }

  layoutAndDraw();
  intro.relayout = layoutAndDraw;

  // ScrollTrigger drives three beats. Each beat = 1/3 of the section progress.
  // Beat 0 (0..0.45): line draws from 0 → fully drawn. Beat 0 copy visible.
  // Beat 1 (0.45..0.7): line stays. Beat 1 copy visible.
  // Beat 2 (0.7..1):    dots pop in. Beat 2 copy visible.
  if (window.gsap && window.ScrollTrigger) {
    const beats = [...document.querySelectorAll(".intro-beat")];
    gsap.set(beats, { opacity: 0, y: 24 });

    let activeBeat = -1;
    const setBeat = idx => {
      if (idx === activeBeat) return;
      activeBeat = idx;
      beats.forEach((b, i) => {
        gsap.to(b, {
          opacity: i === idx ? 1 : 0,
          y: i === idx ? 0 : (i < idx ? -16 : 24),
          duration: 0.4, ease: "power2.out",
        });
      });
    };

    let dotsArmed = false;
    // Reshuffle rebuilds the chart from scratch (svg children removed +
    // recreated). The dotsArmed closure flag would otherwise stay true,
    // suppressing the arm-transition on the new dots. layoutAndDraw calls
    // this after relaying out so the next onUpdate re-runs the arm logic.
    intro._resetArmState = () => { dotsArmed = false; };
    const armDots = (on) => {
      if (on === dotsArmed) return;
      dotsArmed = on;
      const dots = intro.dotsG.selectAll("circle");
      if (on) dots.transition("dots").delay((_, i) => 100 + i * 80).duration(360).attr("r", 6);
      else    dots.transition("dots").duration(200).attr("r", 0);

      // Boldify the connectors + minute labels at turning-point indices in
      // lockstep with the dots arming. Beat 0 ("Highs and lows") shows them
      // uniform; beat 1 ("turning points") promotes the turn ones to ink so
      // the visual emphasis matches what that beat is teaching.
      if (intro.arcConnectors) {
        const turnLines = intro.arcConnectors.selectAll("line").filter(d => d.isTurn);
        turnLines.transition("turn-emph")
          .duration(on ? 360 : 220)
          .ease(d3.easeQuadOut)
          .attr("stroke",  on ? C.ink : C.inkDim)
          .attr("opacity", on ? 0.9  : 0.55);
      }
      if (intro.minuteLabelsG) {
        const turnLabels = intro.minuteLabelsG.selectAll("text").filter(d => d.isTurn);
        turnLabels.transition("turn-emph-label")
          .duration(on ? 360 : 220)
          .ease(d3.easeQuadOut)
          .attr("fill",    on ? C.inkDim  : C.inkFaint)
          .attr("opacity", on ? 0.95 : 0.6);
      }
    };

    // Linear interpolator clamped to [0, 1] over a sub-range of progress.
    const phase = (p, a, b) => {
      if (p <= a) return 0;
      if (p >= b) return 1;
      return (p - a) / (b - a);
    };

    // Time-based "boop boop boop" reveal of the arc-to-baseline connectors
    // and minute labels. Runs once when the line finishes drawing; reverses
    // if the user scrolls back into the line-drawing phase.
    const startConnectorBoop = () => {
      if (!intro.arcConnectors || intro.connectorBooped) return;
      intro.connectorBooped = true;
      intro.arcConnectors.selectAll("line").transition("boop")
        .delay((d, i) => i * 75)
        .duration(220)
        .ease(d3.easeQuadOut)
        .attr("y2", intro.zeroY)
        .attr("opacity", 0.55);
      if (intro.minuteLabelsG) {
        intro.minuteLabelsG.selectAll("text").transition("boop-label")
          .delay((d, i) => i * 75 + 80)
          .duration(180)
          .ease(d3.easeQuadOut)
          .attr("opacity", 0.6);
      }
    };
    const resetConnectors = () => {
      if (!intro.connectorBooped) return;
      intro.connectorBooped = false;
      if (intro.arcConnectors) {
        intro.arcConnectors.selectAll("line")
          .interrupt("boop").interrupt("turn-emph")
          .attr("y2", d => d.py)
          .attr("stroke", C.inkDim)
          .attr("opacity", 0);
      }
      if (intro.minuteLabelsG) {
        intro.minuteLabelsG.selectAll("text")
          .interrupt("boop-label").interrupt("turn-emph-label")
          .attr("fill", C.inkFaint)
          .attr("opacity", 0);
      }
    };

    // Phased reveal driven by scroll progress. Axis structure is compressed
    // into the first ~8% of the section so the user sees the chart's frame
    // (baseline + BEGIN/END + POSITIVE/NEGATIVE) almost as soon as the pin
    // takes hold — instead of scrolling a long way through an empty stage
    // that reads as a stuck render.
    //
    //  0.00 → 0.02  zero baseline fades in
    //  0.02 → 0.05  BEGINNING / END labels fade in (staggered)
    //  0.05 → 0.08  POSITIVE / NEGATIVE labels fade in (staggered)
    //  0.08 → 0.15  beat 0 ("Highs and lows.") fades up
    //  0.15 → 0.55  arc draws (connectors stay hidden)
    //  0.55 → 0.78  arc-to-baseline dashed connectors "boop boop boop" in
    //               sequence; dots arm in the same window
    //  0.78 → 1.00  beat 1 ("turning points") transitions in
    ScrollTrigger.create({
      trigger: ".intro-pin",
      pin: ".intro-stage",
      start: "top top",
      end: "+=340%",
      scrub: 0.4,
      anticipatePin: 1,
      // Cache DOM refs hit on every onUpdate. Querying these per-frame
      // (~60Hz) walked the document on every tick — fine when the page
      // was short, but as new sections were added below the pin the
      // querySelector cost grew enough to make the progress bar judder.
      // Axis nodes (yZeroEl/axisEnds/axisSides) are cached on `intro` by
      // layoutAndDraw so resize-driven relayouts refresh them; the closure
      // reads from there to stay in sync.
      onUpdate: (() => {
        const fill   = document.querySelector(".intro-progress-fill");
        const marker = document.querySelector(".intro-progress-marker");
        return self => {
          const p = self.progress;

          // Editorial progress bar — amber fill traces from left, diamond
          // marker rides the leading edge. Fill uses GPU-composited
          // scaleX (no layout per frame); marker rides via left%.
          if (fill)   fill.style.transform = `scaleX(${p})`;
          if (marker) marker.style.left = (p * 100).toFixed(1) + "%";

          // Axis structure
          if (intro.yZeroEl) intro.yZeroEl.style.opacity = phase(p, 0.00, 0.02);
          intro.axisEnds.forEach((el, i) => {
            el.style.opacity = phase(p, 0.02 + i * 0.012, 0.05 + i * 0.012);
          });
          intro.axisSides.forEach((el, i) => {
            el.style.opacity = phase(p, 0.05 + i * 0.012, 0.08 + i * 0.012);
          });

          // Beat text — beat 0 stays visible through the boop sequence
          let idx = -1;
          if (p >= 0.08 && p < 0.78) idx = 0;
          else if (p >= 0.78) idx = 1;
          setBeat(idx);

          // Arc draws 0.15 → 0.55
          const drawT = phase(p, 0.15, 0.55);
          if (intro.path && intro.totalLen) {
            intro.path.attr("stroke-dashoffset", intro.totalLen * (1 - drawT));
          }

          // Connectors auto-load (time-based) once the line finishes drawing.
          // They retract if the user scrolls back into the line-drawing phase.
          if (drawT >= 1) startConnectorBoop();
          else if (drawT < 0.95) resetConnectors();

          // Dots arm only at beat 1 ("turning points") — they're the subject
          // of that beat, so reserving them for that stage keeps beat 0
          // focused on the line + connectors + minute labels.
          armDots(p >= 0.78);
        };
      })()
    });

    // initial state
    setBeat(-1);
  }
}

// ─────────────────────────────────────────────────────────
// ARCHETYPE DATA (preloaded, used by both the cluster overview and the pin)
// ARCH_DATA[id] = {
//   mean: number[20],          // archetype mean arc
//   closest: number[20][],     // top-N closest cluster members by weight
//   color: string,
//   filmCount: number,
// }
const ARCH_DATA = {};
let CLUSTERED = null;

// Canonical examples named in each archetype's blurb. We force these into
// the closest-N bundle (swapping in for the lowest-weight non-canonical
// entry if needed) so hovering an italicized film name in the paragraph
// reliably bolds a matching line — even when the canonical example doesn't
// crack that archetype's top-N by mixture weight.
const ARCHETYPE_CANONICAL = {
  0: ["Reservoir Dogs", "Catch Me If You Can", "Kill Bill: Volume 1"],
  1: ["The Nutty Professor", "Fight Club"],
  2: ["Inception", "The Matrix"],
  3: ["Anora", "Wedding Crashers"],
  4: ["Gladiator", "The Truman Show"],
  5: ["Die Hard 2", "The Hangover"],
};

async function loadArchData() {
  const shapes = await d3.csv(`${DATA}/archetype_shapes.csv`, d3.autoType);
  CLUSTERED = await d3.csv(`${DATA}/emotional_arcs_clustered.csv`, d3.autoType);

  const wcols = d3.range(1, 21).map(i => `w${String(i).padStart(2, "0")}`);
  const arcOf = row => wcols.map(c => +row[c]);

  // Resolve a canonical title against the full corpus so we can pull the
  // film's arc even when its dominant archetype isn't `id` (Wedding Crashers
  // could plausibly cluster as Tragedy or Cinderella, etc.).
  const findRowByTitle = title => {
    const target = normalizeFilmTitle(title);
    return CLUSTERED.find(r => normalizeFilmTitle(r.title) === target);
  };
  const toEntry = (row, id) => ({
    ys: arcOf(row),
    title: prettyTitle(row.title),
    year: row.year,
    weight: row[`arch_${id}_weight`],
  });

  // archetype_shapes.csv is 1-indexed by archetype_id, but emotional_arcs_clustered.csv
  // uses 0-indexed dominant_archetype. Match by arc_name to bridge the two.
  const CLOSEST_N = 20;
  for (const id of ARCH_ORDER) {
    const shape = shapes.find(r => r.arc_name === ARCHETYPE_NAMES[id]);
    if (!shape) { console.warn(`[archdata] no shape row for ${ARCHETYPE_NAMES[id]}`); continue; }
    const members = CLUSTERED.filter(r => r.dominant_archetype === id);
    const closest = [...members]
      .sort((a, b) => b[`arch_${id}_weight`] - a[`arch_${id}_weight`])
      .slice(0, CLOSEST_N)
      .map(r => toEntry(r, id));

    // Force-include canonical examples. For each, find by title across the
    // whole corpus; if it's already present, keep the existing entry. If
    // missing, append it and drop the lowest-weight NON-canonical entry to
    // hold the count at CLOSEST_N (the morph pairs slot-by-slot, so every
    // archetype's bundle must have the same length).
    const canonicalNorms = new Set(
      (ARCHETYPE_CANONICAL[id] || []).map(normalizeFilmTitle)
    );
    const isCanonical = entry => canonicalNorms.has(normalizeFilmTitle(entry.title));
    for (const title of (ARCHETYPE_CANONICAL[id] || [])) {
      const norm = normalizeFilmTitle(title);
      if (closest.some(c => normalizeFilmTitle(c.title) === norm)) continue;
      const row = findRowByTitle(title);
      if (!row) {
        console.warn(`[archdata] canonical "${title}" not found in corpus for ${ARCHETYPE_NAMES[id]}`);
        continue;
      }
      closest.push(toEntry(row, id));
      // Trim the weakest non-canonical entry so the slot count stays put.
      // Walking from the end finds the lowest-weight non-canonical first
      // because the original top-N was sorted by weight descending.
      for (let i = closest.length - 1; i >= 0; i--) {
        if (!isCanonical(closest[i])) {
          closest.splice(i, 1);
          break;
        }
      }
    }
    // Final sort by weight desc — keeps the strongest matches up front for
    // any consumer that walks the list in rank order.
    closest.sort((a, b) => b.weight - a.weight);

    ARCH_DATA[id] = {
      mean: arcOf(shape),
      closest,
      color: ARCH_COLOR[id],
      filmCount: shape.film_count,
    };
  }

  // copy-side updates
  d3.selectAll("[data-count]").each(function () {
    const id = +this.dataset.count;
    this.textContent = ARCH_DATA[id]?.filmCount?.toLocaleString() ?? "…";
  });
}

// ─────────────────────────────────────────────────────────
// CLUSTER OVERVIEW — six flip cards in a 3×2 grid. Front: the mean arc with
// labels. Back: short blurb on the archetype's color. Click to flip; click
// elsewhere to flip back.
function drawClusterOverview() {
  const grid = document.querySelector(".cluster-grid");
  if (!grid) return;
  grid.innerHTML = "";

  ARCH_ORDER.forEach(id => {
    const card = document.createElement("div");
    card.className = "flip-card";
    card.dataset.archId = id;
    card.innerHTML = `
      <div class="flip-card-inner">
        <div class="flip-front"><svg class="cell-svg"></svg></div>
        <div class="flip-back" style="background:${ARCH_COLOR[id]}">
          <img class="arch-icon" src="${ARCHETYPE_ICONS[id]}" alt="" aria-hidden="true" />
          <h3 class="arch-name">${ARCHETYPE_NAMES[id]}</h3>
          <p class="arch-blurb">${ARCHETYPE_FLIP[id]}</p>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Per-card y-extent (mean only) — same trick the rank-chart hover thumbnails
  // use. Each card's mean fills its full vertical band, so the dramatic shape
  // reads instead of getting squashed by a shared cross-archetype scale that
  // also has to accommodate every closest-line wobble.
  const yPad = 0.05;

  ARCH_ORDER.forEach(id => {
    const cardEl = grid.querySelector(`.flip-card[data-arch-id="${id}"]`);
    const svgEl = cardEl.querySelector("svg.cell-svg");
    const { w: W, h: H } = measure(svgEl.parentNode);
    const svg = d3.select(svgEl)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "none");
    svg.selectAll("*").remove();

    const pad = 28;
    const x = d3.scaleLinear().domain([0, 19]).range([pad, W - pad]);
    // Domain anchors on the mean's own extrema, then expands toward the
    // closest-line extrema by a soft factor — cards whose closest bundles
    // hug the mean stay dramatic; cards whose closest fan out get just
    // enough headroom to keep the wobble from clipping the card edges.
    const meanExt = d3.extent(ARCH_DATA[id].mean);
    const closestExt = d3.extent(ARCH_DATA[id].closest.flatMap(c => c.ys));
    const SOFT = 0.4;
    const lo = meanExt[0] - SOFT * Math.max(0, meanExt[0] - closestExt[0]);
    const hi = meanExt[1] + SOFT * Math.max(0, closestExt[1] - meanExt[1]);
    const y = d3.scaleLinear()
      .domain([lo - yPad, hi + yPad])
      .range([H - pad - 6, pad + 64]);
    const lineFn = d3.line()
      .x((_, i) => x(i))
      .y(d => y(d))
      .curve(d3.curveCatmullRom.alpha(0.6));

    svg.append("text")
      .attr("x", pad).attr("y", pad + 18)
      .attr("fill", C.ink)
      .attr("font-family", "Fraunces, serif")
      .attr("font-variation-settings", '"opsz" 72, "SOFT" 30')
      .attr("font-size", 32)
      .text(ARCHETYPE_NAMES[id]);

    svg.append("text")
      .attr("x", pad).attr("y", pad + 40)
      .attr("fill", ARCH_COLOR[id])
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", 10)
      .attr("letter-spacing", "0.14em")
      .text(ARCHETYPE_SHAPES[id].toUpperCase());

    svg.append("text")
      .attr("x", pad).attr("y", pad + 56)
      .attr("fill", C.inkFaint)
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", 10)
      .attr("letter-spacing", "0.08em")
      .text(`${ARCH_DATA[id].filmCount} FILMS`);

    svg.append("line")
      .attr("x1", pad).attr("x2", W - pad)
      .attr("y1", y(0)).attr("y2", y(0))
      .attr("stroke", "#8e9683")
      .attr("stroke-width", 1.2)
      .attr("stroke-opacity", 0.7);

    svg.append("g").attr("class", "ghosts")
      .selectAll("path")
      .data(ARCH_DATA[id].closest)
      .join("path")
      .attr("d", c => lineFn(c.ys))
      .attr("fill", "none")
      .attr("stroke", ARCH_COLOR[id])
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.35);

    svg.append("path")
      .attr("class", "mean")
      .attr("d", lineFn(ARCH_DATA[id].mean))
      .attr("fill", "none")
      .attr("stroke", ARCH_COLOR[id])
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round");
  });

  // GSAP: stagger-draw the six mean arcs as the section enters view.
  if (window.gsap && window.ScrollTrigger) {
    const means = [...grid.querySelectorAll(".flip-front .mean")];
    const totals = means.map(p => p.getTotalLength());
    means.forEach((p, i) => {
      gsap.set(p, { strokeDasharray: `${totals[i]} ${totals[i]}`, strokeDashoffset: totals[i] });
    });
    gsap.to(means, {
      strokeDashoffset: 0,
      duration: 1.6,
      ease: "power2.inOut",
      stagger: 0.12,
      scrollTrigger: { trigger: ".cluster-board", start: "top 75%" }
    });
    gsap.fromTo([...grid.querySelectorAll(".flip-front .ghosts path")],
      { opacity: 0 },
      {
        opacity: 0.18, duration: 0.5, ease: "power2.out", stagger: 0.005, delay: 0.2,
        scrollTrigger: { trigger: ".cluster-board", start: "top 75%" }
      }
    );
  }

  // Click-to-flip. Each card toggles independently — multiple can be open at
  // once. Click anywhere outside the grid flips all of them back.
  grid.querySelectorAll(".flip-card").forEach(card => {
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      card.classList.toggle("is-flipped");
    });
  });
  document.addEventListener("click", () => {
    grid.querySelectorAll(".flip-card.is-flipped")
      .forEach(c => c.classList.remove("is-flipped"));
  });
}

// ─────────────────────────────────────────────────────────
// ARCHETYPES PIN — single big chart, scrub-driven morph through all six.
const arch = {};

function setupArchPin() {
  const svg = d3.select(".pin-svg");
  const stage = svg.node().parentNode;
  arch.svg = svg;
  arch.stage = stage;
  arch.scrollTrigger = null;

  function layoutAndDraw() {
    const r = stage.getBoundingClientRect();
    const W = Math.max(r.width, 480);
    const H = Math.max(r.height, 360);
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "none");
    svg.selectAll("*").remove();

    // Tight margins so the chart fills the entire viewport. The caption sits
    // bottom-left over a fade-to-bg backdrop (see .pin-stage .pin-meta).
    const m = { top: 60, right: 60, bottom: 60, left: 60 };
    const allYs = ARCH_ORDER.flatMap(id => [
      ...ARCH_DATA[id].mean,
      ...ARCH_DATA[id].closest.flatMap(c => c.ys),
    ]);
    const yExt = d3.extent(allYs);
    const yPad = 0.35;

    const x = d3.scaleLinear().domain([0, 19]).range([m.left, W - m.right]);
    const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([H - m.bottom, m.top]);
    const lineFn = d3.line().x((_, i) => x(i)).y(d => y(d)).curve(d3.curveCatmullRom.alpha(0.6));

    arch.dims = { W, H, m };
    arch.x = x; arch.y = y; arch.lineFn = lineFn;

    drawAxisFrame(svg, { x, y, x0: m.left, x1: W - m.right, withYSides: false, withEndLabels: false });

    // Hide the axis baseline initially — the intro timeline fades it in
    // before the proxy lines unravel.
    svg.select(".y-zero").style("opacity", 0);

    // Pre-compute d-strings for mean and closest-match paths at every
    // archetype, so MorphSVG can tween between them without rebuilding the
    // path each frame.
    arch.meanD    = ARCH_ORDER.map(id => lineFn(ARCH_DATA[id].mean));
    arch.closestD = ARCH_ORDER.map(id => ARCH_DATA[id].closest.map(c => lineFn(c.ys)));

    // Closest-match outlines — one path element per slot, MorphSVG tweens d
    // between archetypes (paired by index). Hover any line to see its film
    // title, year, and how strong a match (%) it is to the archetype average.
    // Each path has stroke-dasharray set to its own length so the intro
    // timeline can "unravel" them one by one (sequential stroke draw).
    const ghostsLayer = svg.append("g").attr("class", "ghosts-layer");
    arch.ghostNodes = [];
    arch.hitNodes = [];
    arch.ghostLens = [];
    const slots = arch.closestD[0].length;
    // Two passes:
    //   1) visible ghost paths (no pointer events) — drawn first so they sit
    //      under the hit paths.
    //   2) wide transparent hit paths on top — broaden the hover target so
    //      a thin 1.4px line doesn't slip out from under the cursor.
    for (let k = 0; k < slots; k++) {
      const visible = ghostsLayer.append("path")
        .attr("class", "ghost-visible")
        .attr("d", arch.closestD[0][k] || arch.closestD[0][0])
        .attr("fill", "none")
        .attr("stroke", ARCH_COLOR[0])
        .attr("stroke-width", 1.4)
        .attr("stroke-opacity", 0.55)
        .style("pointer-events", "none")
        .node();
      const len = visible.getTotalLength();
      visible.style.strokeDasharray = `${len} ${len}`;
      visible.style.strokeDashoffset = String(len);
      arch.ghostNodes.push(visible);
      arch.ghostLens.push(len);
    }
    const hitsLayer = svg.append("g").attr("class", "ghosts-hit");
    for (let k = 0; k < slots; k++) {
      const visible = arch.ghostNodes[k];
      const hit = hitsLayer.append("path")
        .attr("class", "ghost-hit")
        .attr("d", arch.closestD[0][k] || arch.closestD[0][0])
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 18)
        .style("cursor", "pointer")
        .style("pointer-events", "stroke")
        .on("mouseenter", function () {
          if (!arch.introPlayed || arch.introLocked) return;
          const id = arch.activeIdx;
          const meta = (ARCH_DATA[id]?.closest || [])[k];
          if (!meta) return;
          const pct = Math.round(meta.weight * 100);
          d3.select(visible)
            .attr("stroke-opacity", 1)
            .attr("stroke-width", 2.4);
          arch._hoveredGhostIdx = k;
          showPinTip(
            { name: meta.title, year: meta.year },
            { pct, archetype: ARCHETYPE_NAMES[id] },
            ARCH_COLOR[id],
          );
        })
        .on("mouseleave", function () {
          // Don't reset if an em in the blurb is still highlighting this line.
          if (visible.dataset.emHighlight !== "1") {
            d3.select(visible)
              .attr("stroke-opacity", 0.55)
              .attr("stroke-width", 1.4);
          }
          arch._hoveredGhostIdx = -1;
          hidePinTip();
        })
        .node();
      arch.hitNodes.push(hit);
    }

    // Tooltip for closest-match hover lives in HTML (.pin-tip-corner) so it
    // can mirror the corner-count's CSS positioning exactly. arch.W/H still
    // tracked here for layout-dependent code further down.
    arch.W = W; arch.H = H;

    // MEAN arc — drawn but hidden via stroke-dashoffset for the intro reveal.
    // pointer-events:none so the bold mean stroke doesn't shadow the wide
    // hit-paths underneath when the user is trying to hover a closest-15 line
    // that runs near the average.
    arch.meanNode = svg.append("path")
      .attr("class", "mean")
      .attr("d", arch.meanD[0])
      .attr("fill", "none")
      .attr("stroke", ARCH_COLOR[0])
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round")
      .style("pointer-events", "none")
      .node();
    const meanLen = arch.meanNode.getTotalLength();
    arch.meanNode.style.strokeDasharray = `${meanLen} ${meanLen}`;
    arch.meanNode.style.strokeDashoffset = String(meanLen);
    arch.meanLen = meanLen;

    // If the intro has already played (e.g., a resize while past the section)
    // skip the hidden state and show everything immediately.
    if (arch.introPlayed) showArchpinFrame();
  }

  layoutAndDraw();
  arch.relayout = () => {
    layoutAndDraw();
    rebuildArchTimeline();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };

  // Caption DOM refs
  arch.captionEls = {
    title:  document.getElementById("pin-title"),
    shape:  document.getElementById("pin-shape"),
    blurb:  document.getElementById("pin-blurb"),
    count:  document.getElementById("pin-count"),
    idx:    document.getElementById("pin-idx"),
  };
  arch.activeIdx = -1;
  setArchCaption(0, true);

  // Hide the caption block + corner count until the intro reveals them — they
  // shouldn't be visible during the intermission scroll-in or before the
  // average line starts drawing on first archetype.
  const meta = document.querySelector(".pin-stage .pin-meta");
  const corner = document.querySelector(".pin-stage .pin-progress-corner");
  if (!arch.introPlayed) {
    if (meta) meta.style.opacity = "0";
    if (corner) corner.style.opacity = "0";
  }

  rebuildArchTimeline();

  // Phased intro on first view — fires once, runs in real time (NOT scrubbed
  // with scroll). Triggered at "top top" so it fires the instant the section
  // pins, not while the user is still on the prior intermission. Order:
  // baseline → ghost lines → mean arc + text + count. Subsequent archetype
  // morphs are still scroll-driven by rebuildArchTimeline.
  if (window.gsap && window.ScrollTrigger && !arch.introPlayed) {
    ScrollTrigger.create({
      trigger: ".archetypes-pin",
      start: "top top",
      once: true,
      onEnter: playArchpinIntro,
    });
  }
}

// Reveal everything on the archpin SVG immediately — used when the intro has
// already played (e.g., on resize) so we don't strand elements at opacity 0.
function showArchpinFrame() {
  const svg = arch.svg;
  if (!svg) return;
  svg.select(".y-zero").style("opacity", null);
  (arch.ghostNodes || []).forEach(n => {
    n.style.strokeDasharray = "none";
    n.style.strokeDashoffset = "0";
  });
  if (arch.meanNode) {
    arch.meanNode.style.strokeDasharray = "none";
    arch.meanNode.style.strokeDashoffset = "0";
  }
  const meta = document.querySelector(".pin-stage .pin-meta");
  const corner = document.querySelector(".pin-stage .pin-progress-corner");
  if (meta) meta.style.opacity = "";
  if (corner) corner.style.opacity = "";
}

// Wheel + touch scroll lock used by the archpin intro. Listener is attached
// once at module load; flipping arch.introLocked toggles whether scroll input
// is swallowed.
window.addEventListener("wheel", e => {
  if (arch.introLocked) e.preventDefault();
}, { passive: false });
window.addEventListener("touchmove", e => {
  if (arch.introLocked) e.preventDefault();
}, { passive: false });
window.addEventListener("keydown", e => {
  if (!arch.introLocked) return;
  // Block keys that scroll the page during intro.
  const blocked = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
  if (blocked.includes(e.key)) e.preventDefault();
}, { passive: false });
// Belt-and-suspenders: trackpad inertia / scrollbar drag / browser-native
// scroll restore can advance scrollY in ways the wheel and touchmove
// listeners can't catch. While the intro is locked, snap scrollY back to
// the morph trigger's start on every scroll event so the timeline can't
// scrub forward and then "snap back" to Oedipus when the lock releases.
window.addEventListener("scroll", () => {
  if (!arch.introLocked) return;
  const start = arch.timeline?.scrollTrigger?.start;
  if (start == null) return;
  if (Math.abs(window.scrollY - start) > 1) {
    window.scrollTo(0, start);
  }
}, { passive: true });

function playArchpinIntro() {
  if (arch.introPlayed) return;
  arch.introPlayed = true;
  const svg = arch.svg;
  if (!svg) return;

  // Lock scroll for the duration of the intro so the user can't scrub the
  // morph timeline into Icarus / Man in a Hole / etc. before the proxy lines
  // and average finish drawing.
  arch.introLocked = true;

  // Freeze the morph timeline at progress 0 and disable its ScrollTrigger so
  // any incidental scroll (trackpad inertia from before the lock engaged,
  // scrollbar drag, etc.) can't slide the line through Icarus / MIH colors
  // mid-intro. disable(false) preserves the pin state — the section stays
  // pinned, just stops responding to scroll. Re-enable on completion.
  //
  // Before freezing, kill any in-flight tweens AND explicitly reset every
  // morphable path back to its Oedipus shape + color. Otherwise MorphSVG's
  // captured FROM state can be a partially-morphed path (if a fraction of
  // scroll snuck through before the lock engaged), and timeline.progress(0)
  // will "rewind" to that wrong state — the bounce-back the user observed.
  const morphST = arch.timeline?.scrollTrigger;
  if (morphST) {
    // SNAP scroll to pin-start so the morph timeline sits at progress 0
    // regardless of how far the user overshot. The section is pinned, so the
    // user sees no visual jump — only the underlying scrollY is corrected.
    window.scrollTo({ top: morphST.start, behavior: "instant" });

    // Reset every morphable path to its Oedipus shape + color. Then invalidate
    // the timeline so its child tweens recapture FROM on next render — using
    // killTweensOf here would destroy the timeline's children entirely and
    // break all subsequent archetype morphs.
    arch.meanNode.setAttribute("d", arch.meanD[0]);
    arch.meanNode.setAttribute("stroke", ARCH_COLOR[0]);
    arch.ghostNodes.forEach((node, k) => {
      node.setAttribute("d", arch.closestD[0][k] || arch.closestD[0][0]);
      node.setAttribute("stroke", ARCH_COLOR[0]);
    });
    (arch.hitNodes || []).forEach((node, k) => {
      node.setAttribute("d", arch.closestD[0][k] || arch.closestD[0][0]);
    });
    arch.timeline.invalidate();
    arch.timeline.progress(0);
    morphST.disable(false);
  }

  const tl = gsap.timeline({
    onComplete: () => {
      // Land cleanly: snap scroll back to the pin start and freeze the morph
      // at progress 0 BEFORE re-enabling the trigger. Otherwise re-enabling
      // can pick up a stale scrollY and visibly tween the line off Oedipus.
      if (morphST) {
        window.scrollTo({ top: morphST.start, behavior: "instant" });
        arch.timeline.invalidate();
        arch.timeline.progress(0);
      }
      arch.introLocked = false;
      if (morphST) morphST.enable();
    },
  });
  // 1. Zero baseline first — the "plane" everything sits on.
  tl.to(svg.select(".y-zero").node(), {
    opacity: 1, duration: 0.55, ease: "power2.out",
  });
  // 2. The 20 proxy lines unravel one by one — slower per-line draw + larger
  // stagger so the bundle "finds itself" gradually instead of crashing in.
  // ~1.8s per line, 0.13s between starts → ~4.4s total reveal.
  tl.to(arch.ghostNodes, {
    strokeDashoffset: 0,
    duration: 1.8,
    ease: "power2.out",
    stagger: { each: 0.13, from: "start" },
    onComplete: () => {
      // Clear the dasharray so future MorphSVG morphs to longer paths aren't
      // clipped by the original (shorter) dash length.
      arch.ghostNodes.forEach(n => { n.style.strokeDasharray = "none"; });
    },
  }, "+=0.2");
  // 3. Average arc draws — and the caption text + corner count fade in WITH
  // it, so they appear together with the bold line.
  tl.to(arch.meanNode, {
    strokeDashoffset: 0,
    duration: 1.5,
    ease: "power2.inOut",
    onComplete: () => {
      arch.meanNode.style.strokeDasharray = "none";
    },
  }, "+=0.15");
  const meta = document.querySelector(".pin-stage .pin-meta");
  const corner = document.querySelector(".pin-stage .pin-progress-corner");
  const captionTargets = [meta, corner].filter(Boolean);
  if (captionTargets.length) {
    tl.to(captionTargets, {
      opacity: 1, duration: 0.9, ease: "power2.out",
    }, "<");  // start at the same moment the mean line begins drawing
  }
}

// MorphSVG-driven scrubbed timeline. One scroll pass through .archetypes-pin
// runs five sequential segments (0→1, 1→2, ... 4→5). MorphSVG tweens the
// d attribute natively — smoother and more efficient than manual y-lerp.
function rebuildArchTimeline() {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (arch.timeline) { arch.timeline.scrollTrigger?.kill(); arch.timeline.kill(); arch.timeline = null; }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".archetypes-pin",
      pin: ".pin-stage",
      start: "top top",
      end: "+=600%",
      scrub: 0.6,
      anticipatePin: 1,
      onUpdate: self => {
        // active archetype = current segment majority
        const seg = Math.min(self.progress, 0.9999) * (ARCH_ORDER.length);
        const idx = Math.min(Math.floor(seg), ARCH_ORDER.length - 1);
        if (idx !== arch.activeIdx) setArchCaption(idx);
      },
    }
  });

  for (let i = 0; i < ARCH_ORDER.length - 1; i++) {
    const next = i + 1;
    const useMorph = !!window.MorphSVGPlugin;
    const meanTween = useMorph
      ? { morphSVG: arch.meanD[next], duration: 1, ease: "none" }
      : { attr: { d: arch.meanD[next] }, duration: 1, ease: "none" };
    tl.to(arch.meanNode, { ...meanTween, stroke: ARCH_COLOR[next] });

    arch.ghostNodes.forEach((node, k) => {
      const target = arch.closestD[next][k] || arch.closestD[next][0];
      const ghostTween = useMorph
        ? { morphSVG: target, duration: 1, ease: "none" }
        : { attr: { d: target }, duration: 1, ease: "none" };
      tl.to(node, { ...ghostTween, stroke: ARCH_COLOR[next] }, "<");
      // Mirror the d morph onto the wide transparent hit path so the hover
      // target moves with the visible line.
      const hit = arch.hitNodes && arch.hitNodes[k];
      if (hit) {
        const hitTween = useMorph
          ? { morphSVG: target, duration: 1, ease: "none" }
          : { attr: { d: target }, duration: 1, ease: "none" };
        tl.to(hit, hitTween, "<");
      }
    });
  }

  arch.timeline = tl;
}

// Pretty-print a title: lowercase the small words that the corpus JSONs
// title-cased ("The Wolf Of Wall Street" → "The Wolf of Wall Street").
// Always keeps the first and last word capitalized.
const TITLE_SMALL_WORDS = new Set([
  "a","an","and","as","at","but","by","for","from","in","of","on","or",
  "the","to","with","nor","yet","so","up","off","into","over","upon","vs","is"
]);
// Strict Roman-numeral validation. Used inside prettyTitle so words like
// "iii" or "Iv" — which the source data can deliver in title-case mangled
// form ("Rocky Iii", "Star Wars Episode Iv") — render as proper "III"/"IV".
const ROMAN_NUMERAL_RE = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i;
function isRomanNumeral(w) {
  return /^[ivxlcdm]+$/i.test(w) && ROMAN_NUMERAL_RE.test(w);
}

function prettyTitle(t) {
  const s = String(t || "");
  const parts = s.split(/(\s+)/);          // keep whitespace runs
  let wordIdx = 0;
  const wordCount = parts.filter(p => /\S/.test(p)).length;
  return parts.map(p => {
    if (!/\S/.test(p)) return p;
    const isFirst = wordIdx === 0;
    const isLast  = wordIdx === wordCount - 1;
    wordIdx++;
    // Roman numerals — always uppercase regardless of position.
    if (isRomanNumeral(p)) return p.toUpperCase();
    if (!isFirst && !isLast && TITLE_SMALL_WORDS.has(p.toLowerCase())) {
      return p.toLowerCase();
    }
    return p;
  }).join("");
}

// Normalize a film title for fuzzy matching between blurb <em>s and the
// closest-N table. Strips punctuation/casing and collapses a couple of
// common abbreviation variants so e.g. "Kill Bill: Volume 1" (blurb form)
// matches "Kill Bill Vol 1" (corpus form).
function normalizeFilmTitle(t) {
  return String(t || "")
    .toLowerCase()
    .replace(/[''"".,:;!?\-–—()&]/g, "")
    .replace(/\bvolume\b/g, "vol")
    .replace(/\bpart\b/g, "pt")
    .replace(/\s+/g, " ")
    .trim();
}

// Find the closest-N index for a given film title within the active
// archetype's bundle. Returns -1 if no match.
function findGhostIndexForTitle(title) {
  const id = arch.activeIdx;
  const closest = ARCH_DATA[id]?.closest || [];
  const target = normalizeFilmTitle(title);
  if (!target) return -1;
  return closest.findIndex(c => normalizeFilmTitle(c.title) === target);
}

// Wire up <em> film names inside the active blurb so hovering one bolds
// (slightly) the matching closest-15 line. Less bold than the average so
// the line still reads as a member of the bundle, just promoted.
function wireBlurbEmHover() {
  const blurb = arch.captionEls?.blurb;
  if (!blurb) return;
  blurb.querySelectorAll("em").forEach(em => {
    const title = em.textContent;
    em.addEventListener("mouseenter", () => {
      if (!arch.introPlayed || arch.introLocked) return;
      const id = arch.activeIdx;
      const k = findGhostIndexForTitle(title);
      const visible = arch.ghostNodes?.[k];
      const meta = (ARCH_DATA[id]?.closest || [])[k];
      if (!visible || !meta) return;
      visible.dataset.emHighlight = "1";
      em.classList.add("is-film-hover");
      d3.select(visible)
        .attr("stroke-opacity", 0.95)
        .attr("stroke-width", 2.6);
      // Mirror the same tooltip the user gets when hovering the line itself.
      const pct = Math.round(meta.weight * 100);
      showPinTip(
        { name: meta.title, year: meta.year },
        { pct, archetype: ARCHETYPE_NAMES[id] },
        ARCH_COLOR[id],
      );
    });
    em.addEventListener("mouseleave", () => {
      const k = findGhostIndexForTitle(title);
      const visible = arch.ghostNodes?.[k];
      em.classList.remove("is-film-hover");
      hidePinTip();
      if (!visible) return;
      delete visible.dataset.emHighlight;
      // Don't undo the highlight if the user is currently hovering this
      // line directly — the line-hit handler owns the styling in that case.
      if (arch._hoveredGhostIdx !== k) {
        d3.select(visible)
          .attr("stroke-opacity", 0.55)
          .attr("stroke-width", 1.4);
      }
    });
  });
}

// Clear any em-hover bolding stuck on ghost lines. Replacing blurb innerHTML
// destroys the previous <em>s without firing their mouseleave, so without
// this the line that was hover-bolded in the prior archetype stays bold
// forever (and at the matching slot index, which is now a different film).
function clearGhostEmHighlights() {
  (arch.ghostNodes || []).forEach(node => {
    if (node.dataset && node.dataset.emHighlight) {
      delete node.dataset.emHighlight;
      d3.select(node)
        .attr("stroke-opacity", 0.55)
        .attr("stroke-width", 1.4);
    }
  });
}

function setArchCaption(id, instant = false) {
  arch.activeIdx = id;
  const e = arch.captionEls;
  const apply = () => {
    clearGhostEmHighlights();
    e.title.textContent = ARCHETYPE_NAMES[id];
    e.shape.textContent = ARCHETYPE_SHAPES[id];
    e.shape.style.color = ARCH_COLOR[id];          // descriptor matches line color
    e.title.style.color = ARCH_COLOR[id];          // and so does the archetype name
    e.blurb.innerHTML   = ARCHETYPE_BLURBS[id];
    e.blurb.style.setProperty("--archetype-color", ARCH_COLOR[id]);
    e.count.innerHTML   = `<span class="num">${ARCH_DATA[id].filmCount.toLocaleString()}</span> films`;
    e.idx.textContent   = String(id + 1);
    wireBlurbEmHover();
  };
  if (instant || !window.gsap) { apply(); return; }
  const block = [e.title, e.shape, e.blurb, e.count];
  gsap.to(block, {
    opacity: 0, y: 8, duration: 0.18, ease: "power1.in",
    onComplete: () => {
      apply();
      gsap.fromTo(block, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.32, ease: "power2.out" });
    }
  });
}

// title: { name, year } — italic film name + non-italic parenthesized year
// match: { pct, archetype } — "82%" bold + "match to Oedipus" normal weight
// color: archetype hex applied to the whole match line
function showPinTip(title, match, color) {
  const el = document.getElementById("pin-tip");
  if (!el) return;
  // Sanitize: data values are static and from our own arrays, but build via
  // textContent on child spans rather than innerHTML interpolation to be safe.
  el.textContent = "";
  const titleSpan = document.createElement("span");
  titleSpan.className = "pin-tip-title";
  const nameSpan = document.createElement("span");
  nameSpan.className = "pin-tip-name";
  nameSpan.textContent = title.name;
  const yearSpan = document.createElement("span");
  yearSpan.className = "pin-tip-year";
  yearSpan.textContent = ` (${title.year})`;
  titleSpan.appendChild(nameSpan);
  titleSpan.appendChild(yearSpan);

  const matchSpan = document.createElement("span");
  matchSpan.className = "pin-tip-match";
  matchSpan.style.color = color;
  const pctSpan = document.createElement("span");
  pctSpan.className = "pin-tip-pct";
  pctSpan.textContent = `${match.pct}% match`;
  const tailSpan = document.createElement("span");
  tailSpan.className = "pin-tip-tail";
  tailSpan.textContent = ` to ${match.archetype}`;
  matchSpan.appendChild(pctSpan);
  matchSpan.appendChild(tailSpan);

  el.appendChild(titleSpan);
  el.appendChild(matchSpan);
  el.removeAttribute("hidden");
}
function hidePinTip() {
  const el = document.getElementById("pin-tip");
  if (el) el.setAttribute("hidden", "");
}


// ─────────────────────────────────────────────────────────
// WEIGHTS OVER TIME — d3-force beeswarm. Every film in the corpus is one
// circle, colored by its dominant archetype. A force simulation pulls each
// circle toward its (decade × archetype) cell so the chart resolves into a
// 5×6 grid of clusters. Cluster sizes vary (more films archived in later
// decades), but the within-column proportions hold across forty years —
// that's the "the grip holds" reading.
const weightsTime = { rendered: false, played: false };
const WEIGHTS_DECADES = ["1980s", "1990s", "2000s", "2010s", "2020s"];
const WEIGHTS_ARCH_IDS = [0, 1, 2, 3, 4, 5];

async function drawWeightsTime() {
  if (!Array.isArray(CLUSTERED)) {
    console.warn("[weights-time] CLUSTERED not loaded yet; skipping");
    return;
  }
  // Pull every film with a usable (decade, dominant_archetype). Keep title +
  // year so the cluster-hover tooltip can rotate through real film names.
  const films = [];
  for (const r of CLUSTERED) {
    if (!WEIGHTS_DECADES.includes(r.decade)) continue;
    const a = +r.dominant_archetype;
    if (!Number.isFinite(a) || a < 0 || a > 5) continue;
    films.push({
      decade: r.decade,
      arch: a,
      title: prettyTitle(r.title),
      year: r.year,
    });
  }
  weightsTime.films = films;

  // Pre-bucket films by (decade, arch) so the cluster-hover tooltip can
  // sample fresh film titles each time without re-filtering on every move.
  const cellFilms = new Map();
  for (const f of films) {
    const key = `${f.arch}|${f.decade}`;
    if (!cellFilms.has(key)) cellFilms.set(key, []);
    cellFilms.get(key).push(f);
  }
  weightsTime.cellFilms = cellFilms;

  function render() {
    const svg = d3.select(".weights-time-svg");
    if (svg.empty()) return;
    const stage = svg.node().parentNode;
    const r = stage.getBoundingClientRect();
    const W = Math.max(r.width, 480);
    const H = Math.max(r.height, 360);
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "none");
    svg.selectAll("*").remove();
    if (weightsTime.simulation) weightsTime.simulation.stop();

    // Layout: 6 rows (archetypes) × 5 columns (decades). Generous bottom
    // gutter so the decade labels and the corpus caption can breathe below
    // the chart area; left gutter holds the archetype labels.
    const m = { top: 24, right: 56, bottom: 96, left: 184 };
    const innerW = W - m.left - m.right;
    const innerH = H - m.top - m.bottom;

    const decX = d3.scalePoint()
      .domain(WEIGHTS_DECADES)
      .range([m.left + innerW * 0.06, W - m.right - innerW * 0.06])
      .padding(0);
    // Tight vertical padding — every pixel of inner height matters because
    // the largest clusters (2010s Man-in-Hole etc.) have 100+ films and need
    // room to fan out horizontally without bleeding into the row above.
    const archY = d3.scalePoint()
      .domain(WEIGHTS_ARCH_IDS)
      .range([m.top + innerH * 0.02, H - m.bottom - innerH * 0.02])
      .padding(0);

    const staticOpacity = weightsTime.played ? 1 : 0;

    // Caption — bottom-centered, well below the decade labels so the two
    // pieces of mono-spaced text don't crowd each other.
    svg.append("text")
      .attr("class", "wt-caption")
      .attr("x", m.left + innerW / 2)
      .attr("y", H - 18)
      .attr("text-anchor", "middle")
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", 9)
      .attr("letter-spacing", "0.18em")
      .attr("fill", C.inkFaint)
      .attr("opacity", staticOpacity)
      .text("EACH DOT IS A FILM · COLUMN = DECADE · ROW = DOMINANT SHAPE");

    // Subtle row guides so the archetype rows read as bands at a glance.
    WEIGHTS_ARCH_IDS.forEach(id => {
      svg.append("line")
        .attr("class", "wt-row-guide")
        .attr("data-arch", id)
        .attr("x1", m.left + 8).attr("x2", W - m.right - 8)
        .attr("y1", archY(id)).attr("y2", archY(id))
        .attr("stroke", C.rule)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2 6")
        .attr("opacity", staticOpacity);
    });

    // Hover targets stay inert until the reveal finishes — interacting
    // with a half-loaded chart shows wrong tooltips and breaks the
    // reveal sequence. weightsTime.played flips true at the end of
    // playWeightsTimeReveal; on a resize re-render that's already true.
    const hoverPE = weightsTime.played ? "all" : "none";

    // Archetype labels (left). Match the section title typography — Fraunces
    // display with the same opsz/SOFT axis settings — so the row labels read
    // as siblings of the headline rather than utility text.
    WEIGHTS_ARCH_IDS.forEach(id => {
      svg.append("text")
        .attr("class", "wt-row-label")
        .attr("data-arch", id)
        .attr("x", m.left - 16)
        .attr("y", archY(id) + 6)
        .attr("text-anchor", "end")
        // Match the second-reason shape labels: Source Serif 4, weight
        // 500, opsz 32. Colored by archetype.
        .attr("font-family", '"Source Serif 4", Georgia, serif')
        .attr("font-size", 16)
        .attr("font-weight", 500)
        .style("font-variation-settings", '"opsz" 32')
        .attr("fill", ARCH_COLOR[id])
        .attr("opacity", staticOpacity)
        .style("cursor", "pointer")
        .style("pointer-events", hoverPE)
        .text(ARCHETYPE_NAMES[id])
        .on("mouseenter", function (e) { highlightArch(id); showArchTooltip(e, id); })
        .on("mousemove", positionTooltipLeft)
        .on("mouseleave", () => { clearHighlights(); hideTooltip(); });
    });
    WEIGHTS_DECADES.forEach((dec, i) => {
      svg.append("text")
        .attr("class", "wt-col-label")
        .attr("data-decade", dec)
        .attr("data-i", i)
        .attr("x", decX(dec))
        .attr("y", H - m.bottom + 44)
        .attr("text-anchor", "middle")
        .attr("font-family", "JetBrains Mono")
        .attr("font-size", 11)
        .attr("fill", C.inkFaint)
        .attr("opacity", staticOpacity)
        .style("cursor", "pointer")
        .style("pointer-events", hoverPE)
        .text(dec)
        .on("mouseenter", () => highlightDecade(dec))
        .on("mouseleave", clearHighlights);
    });

    // Bigger dots so each film reads as its own object rather than dust.
    // Floor lifted from 2.0 → 3.2 and ceiling from 2.8 → 4.4.
    const R = Math.max(3.2, Math.min(4.4, innerH * 0.0066));
    const COLLIDE = R + 0.6;

    // Initial layout — first time, films are PINNED above their decade
    // column (fx/fy fixed) so they hover off-canvas like rain about to
    // fall. The reveal walks decade by decade, releasing each cohort by
    // clearing fx/fy on its films, at which point the simulation's y-force
    // pulls them into their archetype row. You watch the corpus accumulate
    // chronologically from 1980s → 2020s.
    // On subsequent renders (resize), drop them right into their cells so
    // the chart doesn't replay the sort animation each viewport change.
    const initialScatter = !weightsTime.played;
    const aboveY = m.top - 60;
    const nodes = films.map(f => {
      const colJitter = (Math.random() - 0.5) * 28;
      const startX = decX(f.decade) + colJitter;
      const startY = aboveY + (Math.random() - 0.5) * 50;
      return {
        decade: f.decade,
        arch: f.arch,
        title: f.title,
        year: f.year,
        tx: decX(f.decade),
        ty: archY(f.arch),
        x: initialScatter ? startX : decX(f.decade) + (Math.random() - 0.5) * 12,
        y: initialScatter ? startY : archY(f.arch) + (Math.random() - 0.5) * 12,
        fx: initialScatter ? startX : null,
        fy: initialScatter ? startY : null,
      };
    });

    const dotsG = svg.append("g").attr("class", "wt-dots");
    // If the reveal already played (e.g. this render is from a resize),
    // skip the fade-in / drop animation and snap straight to settled state.
    const initialOpacity = weightsTime.played ? 0.85 : 0;
    const dots = dotsG.selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("class", "wt-dot")
      .attr("data-arch", d => d.arch)
      .attr("data-decade", d => d.decade)
      .attr("r", R)
      .attr("fill", d => ARCH_COLOR[d.arch])
      .attr("fill-opacity", initialOpacity)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    // Force simulation: pull each node toward its (decade, arch) target,
    // collide to avoid stacking. Y is held firmer than X so big clusters
    // can't chain into neighboring rows, but with the chart's extra vertical
    // room we ease off enough that the blobs read as roughly round rather
    // than getting flattened into wide horizontal ovals.
    const sim = d3.forceSimulation(nodes)
      .force("x", d3.forceX(d => d.tx).strength(0.17))
      .force("y", d3.forceY(d => d.ty).strength(0.22))
      .force("collide", d3.forceCollide(COLLIDE).strength(0.9))
      .alpha(0)
      .alphaDecay(0.038)
      .velocityDecay(0.55)
      .on("tick", () => {
        dots.attr("cx", d => d.x).attr("cy", d => d.y);
      });

    weightsTime.simulation = sim;
    weightsTime.dots = dots;
    weightsTime.dotsG = dotsG;
    weightsTime.nodes = nodes;

    // On a re-render after the reveal already played (resize), wake the
    // simulation so the swarm settles into its new geometry, then let it
    // come to rest naturally.
    if (weightsTime.played) {
      sim.alpha(0.7).restart();
    }

    // Hit rectangles per (decade, arch) cell — covers the cluster-hover
    // interaction the user asked for. One transparent rect per cell, sized
    // to the gap between neighboring labels, sits over the dots and catches
    // mouseenter/move/leave. Drawn AFTER dots so the rect wins pointer events.
    const stepX = innerW / (WEIGHTS_DECADES.length - 1);
    const stepY = innerH / (WEIGHTS_ARCH_IDS.length - 1);
    const cellW = stepX * 0.9;
    const cellH = stepY * 0.92;
    const hitG = svg.append("g").attr("class", "wt-hits");
    WEIGHTS_ARCH_IDS.forEach(archId => {
      WEIGHTS_DECADES.forEach(dec => {
        hitG.append("rect")
          .attr("class", "wt-cell-hit")
          .attr("data-arch", archId)
          .attr("data-decade", dec)
          .attr("x", decX(dec) - cellW / 2)
          .attr("y", archY(archId) - cellH / 2)
          .attr("width", cellW)
          .attr("height", cellH)
          .attr("fill", "transparent")
          .style("cursor", "pointer")
          .style("pointer-events", hoverPE)
          .on("mouseenter", function (e) {
            highlightCell(archId, dec);
            showCellTooltip(e, archId, dec);
          })
          .on("mousemove", positionTooltip)
          .on("mouseleave", () => { clearHighlights(); hideTooltip(); });
      });
    });

    // ── Highlight helpers ──
    // Long durations + easeCubicInOut so the dim/un-dim glides instead of
    // snapping. Hover-out (clearHighlights) runs slightly slower than hover-
    // in so a quick mouseleave doesn't yank the chart back abruptly.
    const HL_IN  = 380;
    const HL_OUT = 520;
    const HL_EASE = d3.easeCubicInOut;
    function highlightArch(archId) {
      dots.transition().duration(HL_IN).ease(HL_EASE)
        .attr("fill-opacity", d => d.arch === archId ? 1 : 0.08);
      svg.selectAll(".wt-row-label").transition().duration(HL_IN).ease(HL_EASE)
        .attr("opacity", function () {
          return +this.getAttribute("data-arch") === archId ? 1 : 0.25;
        });
    }
    function highlightDecade(decade) {
      dots.transition().duration(HL_IN).ease(HL_EASE)
        .attr("fill-opacity", d => d.decade === decade ? 1 : 0.08);
      svg.selectAll(".wt-col-label").transition().duration(HL_IN).ease(HL_EASE)
        .attr("opacity", function () {
          return this.getAttribute("data-decade") === decade ? 1 : 0.35;
        });
    }
    function highlightCell(archId, decade) {
      dots.transition().duration(HL_IN).ease(HL_EASE)
        .attr("fill-opacity", d => (d.arch === archId && d.decade === decade) ? 1 : 0.08);
      svg.selectAll(".wt-row-label").transition().duration(HL_IN).ease(HL_EASE)
        .attr("opacity", function () {
          return +this.getAttribute("data-arch") === archId ? 1 : 0.25;
        });
      svg.selectAll(".wt-col-label").transition().duration(HL_IN).ease(HL_EASE)
        .attr("opacity", function () {
          return this.getAttribute("data-decade") === decade ? 1 : 0.35;
        });
    }
    function clearHighlights() {
      dots.transition().duration(HL_OUT).ease(HL_EASE).attr("fill-opacity", 0.85);
      svg.selectAll(".wt-row-label").transition().duration(HL_OUT).ease(HL_EASE).attr("opacity", 1);
      svg.selectAll(".wt-col-label").transition().duration(HL_OUT).ease(HL_EASE).attr("opacity", 1);
    }

    // ── Tooltip wiring ──
    const tooltip = d3.select("#weights-time-tooltip");

    // Default placement: bias to the right of the cursor, flip if no room.
    function positionTooltip(e) { positionTooltipAt(e, "right"); }
    // Archetype labels live on the far left, so their tooltip flips to the
    // left of the cursor instead of pushing into the chart.
    function positionTooltipLeft(e) { positionTooltipAt(e, "left"); }

    function positionTooltipAt(e, side) {
      const parent = stage.getBoundingClientRect();
      const ttRect = tooltip.node().getBoundingClientRect();
      const ttW = ttRect.width  > 40 ? ttRect.width  : 240;
      const ttH = ttRect.height > 40 ? ttRect.height : 140;
      const cx = e.clientX - parent.left;
      const cy = e.clientY - parent.top;
      let top = cy - ttH / 2;
      if (top < 4) top = 4;
      if (top + ttH > parent.height - 4) top = Math.max(4, parent.height - ttH - 4);
      let left;
      if (side === "left") {
        // Hard-left placement — the archetype labels live in the chart's
        // left gutter, so we let the tooltip spill past the container's
        // left edge (chart container has overflow:visible) instead of
        // flipping to the right and covering the chart.
        left = cx - ttW - 16;
      } else {
        left = cx + 16;
        if (left + ttW > parent.width - 4) left = cx - ttW - 16;
        if (left < 4) left = 4;
      }
      tooltip.style("left", left + "px").style("top", top + "px");
    }
    function hideTooltip() { tooltip.classed("is-visible", false); }

    // Build a mean-arc preview SVG for the archetype tooltip — just the
    // curve, no zero-line, no scale, no caption. Tall aspect ratio so the
    // dramatic shape reads instead of getting squashed flat. Domain hugs
    // the data extents tightly so the line fills the available height.
    function buildArcPreview(archId) {
      const W = 150, H = 80, pad = 8;
      const ys = ARCH_DATA[archId]?.mean || [];
      if (!ys.length) return "";
      const x = d3.scaleLinear().domain([0, ys.length - 1]).range([pad, W - pad]);
      const ext = d3.extent(ys);
      const y = d3.scaleLinear().domain(ext).range([H - pad, pad]);
      const lineFn = d3.line().x((_, i) => x(i)).y(d => y(d)).curve(d3.curveCatmullRom.alpha(0.6));
      return `
        <svg class="arc-preview" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <path d="${lineFn(ys)}" fill="none"
                stroke="${ARCH_COLOR[archId]}" stroke-width="2.2"
                stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;
    }

    function showArchTooltip(e, archId) {
      tooltip.html(buildArcPreview(archId));
      tooltip.classed("is-visible", true);
      positionTooltipLeft(e);
    }

    // Pick a fresh handful of titles each hover so the tooltip rotates.
    function pickSampleTitles(archId, decade, n = 5) {
      const pool = cellFilms.get(`${archId}|${decade}`) || [];
      if (!pool.length) return [];
      const indices = new Set();
      while (indices.size < Math.min(n, pool.length)) {
        indices.add(Math.floor(Math.random() * pool.length));
      }
      return [...indices].map(i => pool[i]);
    }

    function showCellTooltip(e, archId, decade) {
      const pool = cellFilms.get(`${archId}|${decade}`) || [];
      const sample = pickSampleTitles(archId, decade, 5);
      const titlesHtml = sample.map(f => `<em>${f.title}</em>`).join("");
      tooltip.html(
        `<strong>${ARCHETYPE_NAMES[archId]} · ${decade}</strong>` +
        `<span class="stat"><span class="num">${pool.length}</span> films land here</span>` +
        `<span class="titles">${titlesHtml}</span>`
      );
      tooltip.classed("is-visible", true);
      positionTooltip(e);
    }
  }

  // Lazy render — 1,627 SVG circles + a force simulation is too heavy to
  // commit at boot. Build the chart only when it scrolls into view, then
  // immediately play the reveal. Resize re-renders only if the chart was
  // already drawn; otherwise the trigger will draw it fresh on first view.
  const ensureRendered = () => {
    if (!weightsTime.rendered) {
      render();
      weightsTime.rendered = true;
    }
  };
  weightsTime._render = () => { if (weightsTime.rendered) render(); };

  if (window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: ".weights-time-chart",
      start: "top 70%",
      once: true,
      onEnter: () => { ensureRendered(); playWeightsTimeReveal(); },
    });
  } else {
    ensureRendered();
    playWeightsTimeReveal();
  }
}

// Phased reveal — every piece arrives on its own beat so the chart builds
// like a paragraph instead of materializing all at once. Mirrors the cadence
// of the dialogue-density chart further down the page.
//
//   t=0.00  GUIDES        row guide-lines fade in
//   t=0.50  ROW LABELS    archetype names stagger top→bottom
//   t=1.80  COL LABELS    decade names stagger left→right
//   t=2.90  CAPTION       chart caption fades in
//   t=3.40  SWARM         dots fade in from above and the simulation slowly
//                          pulls them down into their (decade × arch) cells
//   t=9.00  WIGGLE        a low-amplitude noise force keeps the swarm
//                          breathing instead of frozen
function playWeightsTimeReveal() {
  if (weightsTime.played) return;
  weightsTime.played = true;
  const svg = d3.select(".weights-time-svg");
  if (svg.empty()) return;
  const ease = d3.easeCubicOut;

  svg.selectAll(".wt-row-guide")
    .transition().duration(700).ease(ease).attr("opacity", 1);

  svg.selectAll(".wt-row-label").each(function (_, i) {
    d3.select(this).transition().delay(500 + i * 180).duration(500).ease(ease).attr("opacity", 1);
  });
  svg.selectAll(".wt-col-label").each(function () {
    const i = +this.getAttribute("data-i");
    d3.select(this).transition().delay(1800 + i * 180).duration(460).ease(ease).attr("opacity", 1);
  });
  svg.selectAll(".wt-caption")
    .transition().delay(2900).duration(560).ease(ease).attr("opacity", 1);

  // Chronological fill-in. Films are pinned above their decade column
  // (fx/fy set in render). The reveal walks decade-by-decade, releasing
  // each cohort by clearing fx/fy on its films — at which point the
  // simulation's y-force pulls them down into their archetype rows. You
  // watch the corpus accumulate over forty years, decade by decade.
  if (weightsTime.simulation && weightsTime.dots && weightsTime.nodes) {
    const sim = weightsTime.simulation;
    const dotsArr = weightsTime.dots.nodes();
    const nodesArr = weightsTime.nodes;
    // Group node indices by decade so each cohort can be released as a unit.
    const byDecade = new Map();
    nodesArr.forEach((n, idx) => {
      if (!byDecade.has(n.decade)) byDecade.set(n.decade, []);
      byDecade.get(n.decade).push(idx);
    });

    // Keep the simulation warm throughout the reveal so each freshly
    // released film glides in instead of teleporting.
    sim.alphaTarget(0.12).alpha(0.4).restart();

    // Per-decade timing. CHROME ends ~3.5s in; first cohort drops then.
    const COHORT_START = 3500;
    const COHORT_GAP = 900;   // wait between cohorts
    const COHORT_FADE = 600;  // window over which a cohort's films fade in

    WEIGHTS_DECADES.forEach((dec, decI) => {
      const cohort = byDecade.get(dec) || [];
      if (!cohort.length) return;
      const cohortStart = COHORT_START + decI * COHORT_GAP;
      // Random order within the cohort so it reads as rain, not a sweep.
      const order = d3.shuffle([...cohort]);

      order.forEach((nodeIdx, pos) => {
        const tProg = order.length > 1 ? pos / (order.length - 1) : 0;
        // Back-loaded fade so each decade reads as "trickle, then rain."
        const delay = COHORT_FADE * Math.pow(tProg, 1.5);
        const releaseAt = cohortStart + delay;

        // Release the node (clears the fx/fy pin) and fade its dot in.
        d3.timeout(() => {
          const node = nodesArr[nodeIdx];
          node.fx = null;
          node.fy = null;
          d3.select(dotsArr[nodeIdx])
            .transition().duration(520).ease(d3.easeCubicOut)
            .attr("fill-opacity", 0.85);
        }, releaseAt);
      });

      // Pulse the simulation as each cohort starts so it has the energy
      // to pull the new films down to their rows.
      d3.timeout(() => {
        sim.alpha(0.55).restart();
      }, cohortStart);
    });

    // Final settle: cool the simulation back down so it comes to rest.
    const lastCohortEnd = COHORT_START + (WEIGHTS_DECADES.length - 1) * COHORT_GAP + COHORT_FADE;
    d3.timeout(() => {
      sim.alphaTarget(0).alpha(0.4).restart();
    }, lastCohortEnd + 200);

    // Wake hover after the last decade has had time to settle.
    d3.timeout(() => {
      svg.selectAll(".wt-row-label").style("pointer-events", "all");
      svg.selectAll(".wt-col-label").style("pointer-events", "all");
      svg.selectAll(".wt-cell-hit").style("pointer-events", "all");
    }, lastCohortEnd + 2400);
  }
}




// ─────────────────────────────────────────────────────────
// DIALOGUE DENSITY — per-genre dumbbell. For every major genre, two
// dots: median dialogue density in 1980s–90s vs 2010s–20s. Connected by
// a line whose length = the climb. Sorted by climb magnitude so Horror,
// Thriller, and Sci-Fi (the visceral genres that became verbal) land on
// top. The 2000s are skipped intentionally as the transition decade.
const dialogueDensity = { rendered: false, played: false, rows: null };
const DLG_MIN_PER_BUCKET = 12;     // min films per (genre, bucket) to include
const DLG_BUCKETS = {
  early: { label: "1980s–90s", decades: ["1980s", "1990s"] },
  late:  { label: "2010s–20s", decades: ["2010s", "2020s"] },
};

// Curated low-dialogue outliers from the early bucket — one recognizable
// film per genre, planted to the left of the early dot so the wide tail
// reads at a glance. Late bucket has no equivalents; the empty space on
// the right side of the dumbbell IS the "outliers disappearing" argument.
// `match` is the canonical title slug (compared via normalizeFilmTitle);
// `display` is the prettified label drawn on the chart.
const DLG_OUTLIERS = {
  Horror:            { match: "Friday The 13Th",              display: "Friday the 13th",  year: 1980 },
  Thriller:          { match: "Body Heat",                    display: "Body Heat",        year: 1981 },
  Fantasy:           { match: "Beetlejuice",                  display: "Beetlejuice",      year: 1988 },
  Adventure:         { match: "Jurassic Park",                display: "Jurassic Park",    year: 1993 },
  Action:            { match: "Independence Day",             display: "Independence Day", year: 1996 },
  Comedy:            { match: "Naked Gun 33 The Final Insult", display: "Naked Gun 33⅓",   year: 1994 },
  "Science Fiction": { match: "Et The Extra Terrestrial",     display: "E.T.",             year: 1982 },
  Drama:             { match: "Schindlers List",              display: "Schindler’s List", year: 1993 },
};

async function drawDialogueDensity() {
  const [pacing] = await Promise.all([
    d3.json(`${DATA}/pacing_dialogue.json`),
  ]);
  // We rely on CLUSTERED already being loaded by loadArchData() — that's the
  // canonical source for film_id → primary_genre / decade. The dialogue file
  // is keyed by imdb_id, so build a quick index to join.
  if (!Array.isArray(CLUSTERED)) {
    console.warn("[dialogue-density] CLUSTERED not loaded yet; skipping");
    return;
  }
  const dialByImdb = new Map();
  for (const f of pacing) {
    if (typeof f.dialogue_density === "number") dialByImdb.set(f.imdb_id, f.dialogue_density);
  }

  // Group dialogue density values by [genre][bucket].
  const grid = new Map();   // genre -> { early: [], late: [] }
  for (const film of CLUSTERED) {
    const g = film.primary_genre;
    const dec = film.decade;
    const dval = dialByImdb.get(film.film_id);
    if (typeof dval !== "number" || !g || g === "Unknown") continue;
    let bucket = null;
    if (DLG_BUCKETS.early.decades.includes(dec)) bucket = "early";
    else if (DLG_BUCKETS.late.decades.includes(dec)) bucket = "late";
    if (!bucket) continue;
    if (!grid.has(g)) grid.set(g, { early: [], late: [] });
    grid.get(g)[bucket].push(dval);
  }

  // Keep genres with sufficient sample size in BOTH buckets so the medians
  // are stable. Compute median + IQR per bucket, plus the climb (delta).
  const median = arr => {
    const s = arr.slice().sort(d3.ascending);
    return d3.quantile(s, 0.5);
  };
  const rows = [];
  for (const [genre, buckets] of grid.entries()) {
    if (buckets.early.length < DLG_MIN_PER_BUCKET) continue;
    if (buckets.late.length < DLG_MIN_PER_BUCKET) continue;
    const earlyMed = median(buckets.early);
    const lateMed  = median(buckets.late);
    rows.push({
      genre,
      early:    earlyMed,
      late:     lateMed,
      delta:    lateMed - earlyMed,
      nEarly:   buckets.early.length,
      nLate:    buckets.late.length,
    });
  }
  // Sort by climb magnitude descending — the visceral-genres-became-verbal
  // story sits on top automatically.
  rows.sort((a, b) => b.delta - a.delta);
  dialogueDensity.rows = rows;

  // Resolve each curated outlier against the corpus by (genre, year, title).
  // We match on normalized title to absorb the corpus's idiosyncratic
  // capitalization ("Schindlers List", "Et The Extra Terrestrial") without
  // hardcoding those forms into the display strings.
  const outlierByGenre = new Map();
  for (const r of rows) {
    const pick = DLG_OUTLIERS[r.genre];
    if (!pick) continue;
    const wantTitle = normalizeFilmTitle(pick.match);
    const film = CLUSTERED.find(f =>
      f.primary_genre === r.genre &&
      Number(f.year) === pick.year &&
      normalizeFilmTitle(f.title) === wantTitle
    );
    if (!film) { console.warn(`[dialogue-density] outlier not found: ${pick.display} (${pick.year}) in ${r.genre}`); continue; }
    const density = dialByImdb.get(film.film_id);
    if (typeof density !== "number") continue;
    outlierByGenre.set(r.genre, { ...pick, density });
  }
  dialogueDensity.outliers = outlierByGenre;

  function render() {
    const svg = d3.select(".dialogue-density-svg");
    if (svg.empty()) return;
    const stage = svg.node().parentNode;
    const r = stage.getBoundingClientRect();
    const W = Math.max(r.width, 480);
    const H = Math.max(r.height, 320);
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "none");
    svg.selectAll("*").remove();

    // Margins follow the rank chart's footprint (top/bottom 44, generous left
    // gutter for the genre name, right gutter for the Δ annotation).
    const m = { top: 44, right: 130, bottom: 44, left: 110 };
    const innerW = W - m.left - m.right;
    const innerH = H - m.top - m.bottom;

    // X domain: tight to the data so the dumbbells span the full width.
    // Pad slightly so labels don't clip.
    const xMin = d3.min(rows, d => Math.min(d.early, d.late));
    const xMax = d3.max(rows, d => Math.max(d.early, d.late));
    const pad = 0.02;
    const xS = d3.scaleLinear()
      .domain([Math.max(0, xMin - pad), Math.min(1, xMax + pad)])
      .range([m.left, m.left + innerW]);
    const yS = d3.scaleBand()
      .domain(rows.map(d => d.genre))
      .range([m.top, m.top + innerH])
      .paddingInner(0.4);
    const rowY = (g) => yS(g) + yS.bandwidth() / 2;

    // ── Bucket headers (top) ──
    // Each header pre-fixed with the matching dot glyph so the header doubles
    // as a legend ("○ 1980S–90S" reads as "this glyph means this period").
    const headerY = m.top - 28;
    [["early", "○"], ["late", "●"]].forEach(([key, glyph]) => {
      const meanVal = d3.mean(rows, d => d[key]);
      svg.append("text")
        .attr("class", "dlg-header")
        .attr("x", xS(meanVal))
        .attr("y", headerY)
        .attr("text-anchor", "middle")
        .attr("fill", key === "late" ? C.amber : C.inkDim)
        .attr("font-family", "JetBrains Mono")
        .attr("font-size", 10)
        .style("letter-spacing", "0.18em")
        .style("text-transform", "uppercase")
        .text(`${glyph}  ${DLG_BUCKETS[key].label}`);
    });

    // ── X axis (bottom) ──
    // Each part tagged so the reveal can stagger it: the hairline lands
    // first, then tick marks + tick labels left→right, then the caption.
    const axisG = svg.append("g").attr("class", "dlg-axis");
    const axisY = m.top + innerH + 28;
    axisG.append("line")
      .attr("class", "dlg-axis-hairline")
      .attr("x1", m.left).attr("x2", m.left + innerW)
      .attr("y1", axisY - 14).attr("y2", axisY - 14)
      .attr("stroke", C.rule).attr("stroke-width", 0.6);
    const niceTicks = xS.ticks(5);
    niceTicks.forEach((t, i) => {
      const xv = xS(t);
      axisG.append("line")
        .attr("class", "dlg-axis-tick")
        .attr("data-i", i)
        .attr("x1", xv).attr("x2", xv)
        .attr("y1", axisY - 18).attr("y2", axisY - 10)
        .attr("stroke", C.rule).attr("stroke-width", 0.6);
      axisG.append("text")
        .attr("class", "dlg-axis-tick-label")
        .attr("data-i", i)
        .attr("x", xv).attr("y", axisY)
        .attr("text-anchor", "middle")
        .attr("fill", C.inkDim)
        .attr("font-family", "JetBrains Mono")
        .attr("font-size", 10)
        .style("letter-spacing", "0.06em")
        .text(`${Math.round(t * 100)}%`);
    });
    axisG.append("text")
      .attr("class", "dlg-axis-caption")
      .attr("x", m.left + innerW / 2).attr("y", axisY + 24)
      .attr("text-anchor", "middle")
      .attr("fill", C.inkFaint)
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", 9)
      .style("letter-spacing", "0.18em")
      .style("text-transform", "uppercase")
      .text("median dialogue · share of total words");

    // Climb-magnitude color, used by both the dumbbell and the outlier marks.
    const sortedDeltas = rows.map(r => r.delta).slice().sort(d3.ascending);
    const colorOf = delta => {
      const t = (delta - sortedDeltas[0]) / (sortedDeltas[sortedDeltas.length - 1] - sortedDeltas[0] || 1);
      return t > 0.66 ? C.amber : (t > 0.33 ? C.amberSoft : C.inkDim);
    };

    // ── Outlier leaders ──
    // For each genre with a curated outlier, a thin dashed leader runs from
    // the early dot leftward to a small dot, with a one-line label naming
    // the film and its dialogue %. Leader length is scaled to the spread
    // between the row's median and the outlier's actual density, so genres
    // that converged hardest reach furthest left.
    const outlierEntries = rows
      .map(r => ({ r, out: outlierByGenre.get(r.genre) }))
      .filter(e => e.out);
    const maxSpread = d3.max(outlierEntries, e => e.r.early - e.out.density) || 1;
    const earliestEarlyX = d3.min(rows, r => xS(r.early));
    const trailMaxPx = Math.max(60, earliestEarlyX - m.left - 8);
    const trailScale = d3.scaleLinear().domain([0, maxSpread]).range([24, trailMaxPx]);

    // ── Per-genre rows ──
    rows.forEach(d => {
      const yy = rowY(d.genre);
      const lineColor = colorOf(d.delta);
      const lineOp = 0.85;

      const grp = svg.append("g")
        .datum(d)
        .attr("class", "dlg-row")
        .attr("data-genre", d.genre);

      // Faint guide line across the row (extends full chart width).
      grp.append("line")
        .attr("class", "dlg-guide")
        .attr("x1", m.left).attr("x2", m.left + innerW)
        .attr("y1", yy).attr("y2", yy)
        .attr("stroke", C.rule)
        .attr("stroke-width", 0.4)
        .attr("opacity", 0.6);

      // Outlier leader + label (only for genres in the curated picks).
      const out = outlierByGenre.get(d.genre);
      if (out) {
        const spread = d.early - out.density;
        const trailLen = trailScale(spread);
        const trailRight = xS(d.early) - 6;
        const trailLeft = trailRight - trailLen;

        grp.append("line")
          .attr("class", "dlg-outlier-leader")
          .attr("x1", trailLeft).attr("x2", trailRight)
          .attr("y1", yy).attr("y2", yy)
          .attr("stroke", lineColor)
          .attr("stroke-width", 0.8)
          .attr("stroke-dasharray", "2 3")
          .attr("opacity", 0.6);

        grp.append("circle")
          .attr("class", "dlg-outlier-tip")
          .attr("cx", trailLeft).attr("cy", yy)
          .attr("r", 3)
          .attr("fill", lineColor);

        grp.append("text")
          .attr("class", "dlg-outlier-label")
          .attr("x", trailLeft + 8).attr("y", yy - 8)
          .attr("text-anchor", "start")
          .attr("font-family", "Fraunces, serif")
          .attr("font-size", 11)
          .attr("fill", lineColor)
          .html(`<tspan font-style="italic">${out.display}</tspan>, ${Math.round(out.density * 100)}%`);
      }

      // Dumbbell connector — early to late. Stroke width matches the rank
      // chart's muted lines so the two visualizations feel proportional.
      grp.append("line")
        .attr("class", "dlg-connector")
        .attr("x1", xS(d.early)).attr("x2", xS(d.late))
        .attr("y1", yy).attr("y2", yy)
        .attr("stroke", lineColor)
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        .attr("opacity", lineOp);

      // Early dot — hollow ring in ink-dim. Sizes mirror the rank chart's
      // nodes (5/5.5).
      grp.append("circle")
        .attr("class", "dlg-dot dlg-dot-early")
        .attr("cx", xS(d.early)).attr("cy", yy)
        .attr("r", 4.5)
        .attr("fill", C.bg)
        .attr("stroke", C.inkDim)
        .attr("stroke-width", 1.3);
      // Late dot — filled in the row's accent color.
      grp.append("circle")
        .attr("class", "dlg-dot dlg-dot-late")
        .attr("cx", xS(d.late)).attr("cy", yy)
        .attr("r", 5.5)
        .attr("fill", lineColor)
        .attr("stroke", "none");

      // Genre label (left) — same size as the rank chart's archetype names
      // (font-size 14, Fraunces) so the two charts read as a typographic pair.
      grp.append("text")
        .attr("class", "dlg-genre-label")
        .attr("x", m.left - 18).attr("y", yy + 4)
        .attr("text-anchor", "end")
        .attr("fill", C.ink)
        .attr("font-family", "Fraunces, serif")
        .attr("font-variation-settings", '"opsz" 72, "SOFT" 30')
        .attr("font-size", 14)
        .attr("font-weight", 400)
        .text(d.genre);

      // Delta annotation (right) — `+18.9pt` style. Filled in the same
      // accent color so the eye can read the climb at a glance.
      const sign = d.delta >= 0 ? "+" : "−";
      const mag = Math.abs(d.delta * 100);
      grp.append("text")
        .attr("class", "dlg-delta")
        .attr("x", m.left + innerW + 18)
        .attr("y", yy + 4)
        .attr("text-anchor", "start")
        .attr("fill", lineColor)
        .attr("font-family", "JetBrains Mono")
        .attr("font-size", 11)
        .style("letter-spacing", "0.04em")
        .text(`${sign}${mag.toFixed(1)}pt`);

      // Wide invisible hit-rect across the row so hover catches anywhere on
      // the row (not just the small dots). Pointer-events stay off until the
      // reveal completes — hover should never fire mid-animation.
      grp.append("rect")
        .attr("class", "dlg-hit")
        .attr("x", m.left).attr("y", yy - yS.bandwidth() / 2)
        .attr("width", innerW).attr("height", yS.bandwidth())
        .attr("fill", "transparent")
        .style("cursor", "pointer")
        .style("pointer-events", dialogueDensity.played ? "all" : "none");
    });

    // ── Hover wiring ──
    const tooltip = d3.select("#dialogue-density-tooltip");
    const allRows = svg.selectAll(".dlg-row");
    const earlyLabel = DLG_BUCKETS.early.label;
    const lateLabel  = DLG_BUCKETS.late.label;

    function highlightRow(activeGenre) {
      allRows.transition().duration(140).attr("opacity", function () {
        return this.getAttribute("data-genre") === activeGenre ? 1 : 0.28;
      });
    }
    function clearHighlight() {
      allRows.transition().duration(160).attr("opacity", 1);
      tooltip.classed("is-visible", false);
    }
    function positionTooltip(e) {
      const parent = svg.node().parentNode.getBoundingClientRect();
      const ttRect = tooltip.node().getBoundingClientRect();
      const ttW = ttRect.width  > 40 ? ttRect.width  : 240;
      const ttH = ttRect.height > 40 ? ttRect.height : 140;
      const cx = e.clientX - parent.left;
      const cy = e.clientY - parent.top;
      let top = cy - ttH - 14;
      if (top < 4) top = cy + 16;
      if (top + ttH > parent.height - 4) top = Math.max(4, parent.height - ttH - 4);
      let left = cx + 16;
      if (left + ttW > parent.width - 4) left = cx - ttW - 16;
      if (left < 4) left = 4;
      tooltip.style("left", left + "px").style("top", top + "px");
    }
    svg.selectAll("rect.dlg-hit")
      .on("mouseenter", function (e, d) {
        highlightRow(d.genre);
        const fmtPct = v => `${(v * 100).toFixed(1)}%`;
        const sign = d.delta >= 0 ? "↑ +" : "↓ −";
        tooltip.html(
          `<strong>${d.genre}</strong>` +
          `<span class="stat">${earlyLabel} · median <span class="num">${fmtPct(d.early)}</span> · ${d.nEarly} films</span>` +
          `<span class="stat">${lateLabel} · median <span class="num">${fmtPct(d.late)}</span> · ${d.nLate} films</span>` +
          `<span class="delta">${sign}${Math.abs(d.delta * 100).toFixed(1)} percentage points</span>`
        );
        tooltip.classed("is-visible", true);
        positionTooltip(e);
      })
      .on("mousemove", positionTooltip)
      .on("mouseleave", clearHighlight);

    // Hide everything for the reveal animation. Per-piece opacity so the
    // reveal can light each axis element in order.
    if (!dialogueDensity.played) {
      svg.selectAll(".dlg-row").attr("opacity", 0);
      svg.selectAll(".dlg-header").attr("opacity", 0);
      svg.selectAll(".dlg-axis-hairline").attr("opacity", 0);
      svg.selectAll(".dlg-axis-tick").attr("opacity", 0);
      svg.selectAll(".dlg-axis-tick-label").attr("opacity", 0);
      svg.selectAll(".dlg-axis-caption").attr("opacity", 0);
    }
  }

  render();
  dialogueDensity._render = render;
  dialogueDensity.rendered = true;

  if (window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: ".dialogue-density-chart",
      // Fire later — at "top 65%" the chart is well inside the viewport
      // by the time the reveal starts, so the user is settled on the
      // section instead of catching the x-axis mid-scroll.
      start: "top 65%",
      once: true,
      onEnter: () => playDialogueDensityReveal(),
    });
  } else {
    playDialogueDensityReveal();
  }
}

// Phased reveal — deliberately gradual so each piece registers before the
// next begins. Hit-rect pointer events only wake at the very end so hover
// can't fire during the build-up.
//
//   t=0.00  HAIRLINE       x-axis hairline draws
//   t=0.55  TICKS          tick marks + tick % labels stagger left→right
//   t=1.55  CAPTION        "MEDIAN DIALOGUE …" caption fades in
//   t=2.00  LEGEND         bucket headers (○ then / ● now) stagger
//   t=2.80  ROWS           per-row reveal, one after the next, with each
//                            row's elements playing in sequence:
//                              · genre label fades in
//                              · early dot pops
//                              · connector grows out to late dot
//                              · late dot pops + Δ number lands
//                              · outlier leader reaches back from the
//                                early dot toward the named film
//                              · outlier tip dot pops + label fades in
function playDialogueDensityReveal() {
  if (dialogueDensity.played) return;
  dialogueDensity.played = true;
  const svg = d3.select(".dialogue-density-svg");
  if (svg.empty()) return;

  const ease = d3.easeCubicOut;

  // 1. Hairline — slower draw so the axis doesn't finish before the user
  //    has fully scrolled into the section.
  svg.selectAll(".dlg-axis-hairline")
    .transition().duration(900).ease(ease).attr("opacity", 1);

  // 2. Tick marks + tick %s — stagger left to right so the axis "writes" in.
  //    Larger stagger pushes the last tick out to ~1.6s, closer to the
  //    caption's start so the gap doesn't read as the axis being done early.
  const TICK_STAGGER = 180;
  svg.selectAll(".dlg-axis-tick").each(function () {
    const i = +this.getAttribute("data-i");
    d3.select(this)
      .transition().delay(700 + i * TICK_STAGGER).duration(420).ease(ease)
      .attr("opacity", 1);
  });
  svg.selectAll(".dlg-axis-tick-label").each(function () {
    const i = +this.getAttribute("data-i");
    d3.select(this)
      .transition().delay(800 + i * TICK_STAGGER).duration(480).ease(ease)
      .attr("opacity", 1);
  });

  // 3. Caption — lands right after the last tick label so the axis flows
  //    directly into the legend without a stranded "axis-only" beat.
  svg.selectAll(".dlg-axis-caption")
    .transition().delay(1900).duration(480).ease(ease).attr("opacity", 1);

  // 4. Bucket headers (legend) — stagger then→now.
  svg.selectAll(".dlg-header").each(function (_, i) {
    d3.select(this)
      .transition().delay(2300 + i * 220).duration(520).ease(ease)
      .attr("opacity", 1);
  });

  // 5. Per-row reveal — generous stagger so each row reads as its own
  //    moment instead of blurring into a wave. Within a row, the dumbbell
  //    builds first (climb forward into today), and only THEN the outlier
  //    leader reaches back from the early dot to its named film — a small
  //    narrative beat: "here's the climb, and here's what the spread used
  //    to look like underneath it."
  const rowNodes = svg.selectAll(".dlg-row").nodes();
  const ROW_STAGGER = 220;
  const ROWS_START = 3100;

  rowNodes.forEach((node, i) => {
    const sel = d3.select(node);
    const rowDelay = i * ROW_STAGGER;

    // Row container becomes visible; child transitions drive the reveal.
    sel.attr("opacity", 1);

    // Hide all children up front so we can stage them.
    sel.select(".dlg-guide").attr("opacity", 0);
    sel.select(".dlg-genre-label").attr("opacity", 0);
    sel.select(".dlg-dot-early").attr("opacity", 0);
    sel.select(".dlg-dot-late").attr("opacity", 0);
    sel.select(".dlg-delta").attr("opacity", 0);
    sel.select(".dlg-outlier-leader").attr("opacity", 0);
    sel.select(".dlg-outlier-tip").attr("opacity", 0);
    sel.select(".dlg-outlier-label").attr("opacity", 0);

    const connector = sel.select(".dlg-connector");
    const earlyX = +connector.attr("x1");
    const lateX  = +connector.attr("x2");
    connector.attr("x2", earlyX).attr("opacity", 0);

    // Outlier leader: stash both ends so we can grow it leftward from the
    // early-dot side back to its tip. Initial state is fully collapsed at
    // the dumbbell side; the reveal expands it outward.
    const leader = sel.select(".dlg-outlier-leader");
    let leaderLeft = null, leaderRight = null;
    if (!leader.empty()) {
      leaderLeft = +leader.attr("x1");
      leaderRight = +leader.attr("x2");
      leader.attr("x1", leaderRight);
    }

    // 5a — genre label + faint guide line.
    sel.select(".dlg-genre-label")
      .transition().delay(ROWS_START + rowDelay).duration(360).ease(ease)
      .attr("opacity", 1);
    sel.select(".dlg-guide")
      .transition().delay(ROWS_START + rowDelay + 60).duration(360).ease(ease)
      .attr("opacity", 0.6);

    // 5b — early dot pops.
    sel.select(".dlg-dot-early")
      .transition().delay(ROWS_START + rowDelay + 220).duration(260).ease(ease)
      .attr("opacity", 1);

    // 5c — connector grows from early to late.
    connector
      .transition().delay(ROWS_START + rowDelay + 360).duration(640).ease(ease)
      .attr("opacity", 0.85)
      .attr("x2", lateX);

    // 5d — late dot pops + Δ annotation lands at the end of the connector.
    sel.select(".dlg-dot-late")
      .transition().delay(ROWS_START + rowDelay + 980).duration(280)
      .ease(d3.easeBackOut.overshoot(1.5))
      .attr("opacity", 1);
    sel.select(".dlg-delta")
      .transition().delay(ROWS_START + rowDelay + 980).duration(420).ease(ease)
      .attr("opacity", 1);

    // 5e — outlier leader reaches back from the early dot toward its tip.
    //      Only fires for genres in the curated picks; safe-no-op otherwise.
    if (!leader.empty()) {
      leader
        .transition().delay(ROWS_START + rowDelay + 1320).duration(620).ease(ease)
        .attr("opacity", 0.6)
        .attr("x1", leaderLeft);

      // 5f — tip dot pops at the leader's left end, label fades in alongside.
      sel.select(".dlg-outlier-tip")
        .transition().delay(ROWS_START + rowDelay + 1880).duration(280)
        .ease(d3.easeBackOut.overshoot(1.5))
        .attr("opacity", 1);
      sel.select(".dlg-outlier-label")
        .transition().delay(ROWS_START + rowDelay + 1880).duration(440).ease(ease)
        .attr("opacity", 1);
    }
  });

  // Wake hit-rect pointer events once the last row's outlier label settles.
  // 1880 (label start) + 440 (label duration) + 100 (beat) = 2420 per-row.
  const PER_ROW_DURATION = 2420;
  const lastEnd = ROWS_START + (rowNodes.length - 1) * ROW_STAGGER + PER_ROW_DURATION;
  d3.timeout(() => {
    svg.selectAll("rect.dlg-hit").style("pointer-events", "all");
  }, lastEnd);
}


// ─────────────────────────────────────────────────────────
// SHAPE SHIFT — second reason. A stacked-area chart with a click-to-drill
// interaction. Default ("genres") view shows each decade's composition by
// primary genre, totaling 100%. Clicking any band drills into THAT genre:
// the chart re-renders with the same x-axis but bands now show the
// dominant-archetype share WITHIN films of that genre. Drama drilldown
// reveals Rags-to-Riches collapsing inside Drama; Horror drilldown
// reveals Icarus surging. The drilldown turns the genre-mix story into a
// shape story without leaving the chart.
const shapeShift = { rendered: false, played: false, mode: "genres" };
const SS_DECADES = ["1980s", "1990s", "2000s", "2010s", "2020s"];
const SS_GENRE_ORDER = ["Drama", "Comedy", "Action", "Horror", "Adventure", "Animation", "Other"];
const SS_NAMED = new Set(["Drama", "Comedy", "Action", "Horror", "Adventure", "Animation"]);
const SS_DRILLABLE = new Set(["Drama", "Comedy", "Action", "Horror", "Adventure", "Animation"]);
// Genre palette — graduated charcoal monotone. Drama (the anchor) is
// near-black, each band above lightens by a step. The stack reads as
// a single tonal field — weight at the bottom, air at the top — and
// hands off cleanly to the saturated archetype palette in drilldown.
const SS_GENRE_COLOR = {
  Drama:     "#1a1d22", // near-ink — hero anchor
  Comedy:    "#3a4049",
  Action:    "#5a626d",
  Horror:    "#7a8290",
  Adventure: "#969da6",
  Animation: "#b0b6bb",
  Other:     "#c8cbcd", // lightest — sits just above the page rule
};
// Archetype stack order from BOTTOM up. Heaviest narrative shapes anchor
// the bottom (Tragedy/Icarus); lightest at top — so any darkening of the
// stack mix shows as the bottom band growing upward.
const SS_ARCH_STACK_ORDER = [3, 1, 0, 2, 5, 4];

async function drawShapeShift() {
  if (!Array.isArray(CLUSTERED)) {
    console.warn("[shape-shift] CLUSTERED not loaded yet; skipping");
    return;
  }

  // ── Genre-view data ──
  const genreCounts = new Map();
  const genreTotals = new Map();
  for (const r of CLUSTERED) {
    if (!SS_DECADES.includes(r.decade)) continue;
    let g = r.primary_genre;
    if (!g || g === "Unknown") continue;
    if (!SS_NAMED.has(g)) g = "Other";
    genreTotals.set(r.decade, (genreTotals.get(r.decade) || 0) + 1);
    const k = `${r.decade}|${g}`;
    genreCounts.set(k, (genreCounts.get(k) || 0) + 1);
  }
  const genreDecadeRows = SS_DECADES.map(dec => {
    const tot = genreTotals.get(dec) || 1;
    const row = { decade: dec };
    SS_GENRE_ORDER.forEach(g => {
      row[g] = (genreCounts.get(`${dec}|${g}`) || 0) / tot;
    });
    return row;
  });
  const genreView = {
    mode: "genres",
    keys: SS_GENRE_ORDER,
    decadeRows: genreDecadeRows,
    stackedSeries: d3.stack().keys(SS_GENRE_ORDER).order(d3.stackOrderNone)(genreDecadeRows),
    color: k => SS_GENRE_COLOR[k],
    label: k => k,
    isHero: k => k === "Drama",
  };

  // ── Archetype-within-genre data, plus per-cell film samples ──
  const archViews = {};
  // filmsByCell: Map<"Genre|A#|Decade", string[]>
  const filmsByCell = new Map();
  for (const r of CLUSTERED) {
    if (!SS_DECADES.includes(r.decade)) continue;
    if (!SS_NAMED.has(r.primary_genre)) continue;
    const a = +r.dominant_archetype;
    if (!Number.isFinite(a) || a < 0 || a > 5) continue;
    const k = `${r.primary_genre}|${a}|${r.decade}`;
    if (!filmsByCell.has(k)) filmsByCell.set(k, []);
    filmsByCell.get(k).push(prettyTitle(r.title));
  }
  for (const genre of SS_DRILLABLE) {
    const archCounts = new Map();
    const archTotals = new Map();
    for (const r of CLUSTERED) {
      if (!SS_DECADES.includes(r.decade)) continue;
      if (r.primary_genre !== genre) continue;
      const a = +r.dominant_archetype;
      if (!Number.isFinite(a) || a < 0 || a > 5) continue;
      archTotals.set(r.decade, (archTotals.get(r.decade) || 0) + 1);
      const k = `${r.decade}|${a}`;
      archCounts.set(k, (archCounts.get(k) || 0) + 1);
    }
    const decadeRows = SS_DECADES.map(dec => {
      const tot = archTotals.get(dec) || 1;
      const row = { decade: dec, _total: archTotals.get(dec) || 0 };
      SS_ARCH_STACK_ORDER.forEach(a => {
        row[`A${a}`] = (archCounts.get(`${dec}|${a}`) || 0) / tot;
      });
      return row;
    });
    const keys = SS_ARCH_STACK_ORDER.map(a => `A${a}`);
    archViews[genre] = {
      mode: "archetypes",
      genre,
      keys,
      decadeRows,
      stackedSeries: d3.stack().keys(keys).order(d3.stackOrderNone)(decadeRows),
      color: k => ARCH_COLOR[+k.slice(1)],
      label: k => ARCHETYPE_NAMES[+k.slice(1)],
      shape: k => ARCHETYPE_SHAPES[+k.slice(1)],
      isHero: () => false,
    };
  }
  shapeShift.genreView = genreView;
  shapeShift.archViews = archViews;
  shapeShift.filmsByCell = filmsByCell;

  function viewForMode() {
    return shapeShift.mode === "genres" ? genreView : archViews[shapeShift.mode];
  }

  // Pick a fresh sample of film titles for the current (genre, archetype, decade).
  function pickSampleFilms(genre, archId, decade, n = 4) {
    const pool = filmsByCell.get(`${genre}|${archId}|${decade}`) || [];
    if (!pool.length) return [];
    const indices = new Set();
    const max = Math.min(n, pool.length);
    while (indices.size < max) indices.add(Math.floor(Math.random() * pool.length));
    return [...indices].map(i => pool[i]);
  }

  // Layout helpers reused by render and reveal.
  function getLayout() {
    const svg = d3.select(".shape-shift-svg");
    if (svg.empty()) return null;
    const stage = svg.node().parentNode;
    const r = stage.getBoundingClientRect();
    const W = Math.max(r.width, 480);
    const H = Math.max(r.height, 320);
    const m = { top: 36, right: 200, bottom: 56, left: 56 };
    const innerW = W - m.left - m.right;
    const innerH = H - m.top - m.bottom;
    const xS = d3.scalePoint().domain(SS_DECADES).range([m.left, m.left + innerW]).padding(0);
    const yS = d3.scaleLinear().domain([0, 1]).range([H - m.bottom, m.top]);
    return { svg, stage, W, H, m, innerW, innerH, xS, yS };
  }

  function render() {
    const layout = getLayout();
    if (!layout) return;
    const { svg, stage, W, H, m, innerW, innerH, xS, yS } = layout;

    // First-time render: build full scaffold (chrome + bands group + tooltip).
    // Subsequent renders: just update bands, labels, breadcrumb, caption.
    const view = viewForMode();
    const isDrilled = shapeShift.mode !== "genres";
    const tooltip = d3.select("#shape-shift-tooltip");

    let chrome = svg.select(".ss-chrome");
    let firstTime = chrome.empty();
    if (firstTime) {
      svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "none");
      svg.selectAll("*").remove();

      // Defs (reusable clip-path for bands sweep on initial reveal).
      const defs = svg.append("defs");
      defs.append("clipPath").attr("id", "ss-clip")
        .append("rect")
        .attr("class", "ss-clip-rect")
        .attr("x", m.left).attr("y", m.top)
        .attr("width", shapeShift.played ? innerW : 0)
        .attr("height", innerH);

      chrome = svg.append("g").attr("class", "ss-chrome");
      // Y-axis grid + labels.
      [0, 0.25, 0.5, 0.75, 1].forEach(t => {
        chrome.append("line")
          .attr("class", "ss-y-grid")
          .attr("data-zero", t === 0 ? 1 : 0)
          .attr("x1", m.left).attr("x2", m.left + innerW)
          .attr("y1", yS(t)).attr("y2", yS(t))
          .attr("stroke", t === 0 ? C.inkDim : C.rule)
          .attr("stroke-width", t === 0 ? 1 : 0.5)
          .attr("stroke-dasharray", t === 0 ? null : "2 6")
          .attr("opacity", 0);
        chrome.append("text")
          .attr("class", "ss-y-label")
          .attr("x", m.left - 12).attr("y", yS(t) + 4)
          .attr("text-anchor", "end")
          .attr("font-family", "JetBrains Mono")
          .attr("font-size", 10)
          .attr("fill", C.inkFaint)
          .attr("opacity", 0)
          .text(`${Math.round(t * 100)}%`);
      });
      // Decade labels.
      SS_DECADES.forEach(dec => {
        chrome.append("text")
          .attr("class", "ss-decade-label")
          .attr("data-decade", dec)
          .attr("x", xS(dec)).attr("y", H - m.bottom + 24)
          .attr("text-anchor", "middle")
          .attr("font-family", "JetBrains Mono")
          .attr("font-size", 11)
          .attr("fill", C.inkFaint)
          .attr("opacity", 0)
          .text(dec);
      });
      // Bands group (clipped only on the initial reveal; clip-rect is full
      // width by then so subsequent renders are unconstrained).
      svg.append("g").attr("class", "ss-bands").attr("clip-path", "url(#ss-clip)");
      // Layer for band labels (right edge).
      svg.append("g").attr("class", "ss-band-labels");
      // Layer for breadcrumb / back link.
      svg.append("g").attr("class", "ss-meta");
      // Caption.
      svg.append("text")
        .attr("class", "ss-caption")
        .attr("x", m.left + innerW / 2).attr("y", H - 12)
        .attr("text-anchor", "middle")
        .attr("font-family", "JetBrains Mono")
        .attr("font-size", 9)
        .attr("letter-spacing", "0.18em")
        .attr("fill", C.inkFaint)
        .attr("opacity", 0)
        .text("");
    }

    const bandsG = svg.select(".ss-bands");
    const labelsG = svg.select(".ss-band-labels");
    const metaG   = svg.select(".ss-meta");
    const caption = svg.select(".ss-caption");

    // ── Breadcrumb / back link (refresh each render) ──
    metaG.selectAll("*").remove();
    metaG.append("text")
      .attr("class", "ss-crumb-root")
      .attr("x", m.left).attr("y", m.top - 22)
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", 10)
      .attr("letter-spacing", "0.22em")
      .attr("fill", isDrilled ? C.inkFaint : C.ink)
      .style("cursor", isDrilled ? "pointer" : "default")
      .text("ALL FILMS")
      .on("click", () => {
        if (!isDrilled) return;
        shapeShift.mode = "genres";
        render();
      });
    if (isDrilled) {
      metaG.append("text")
        .attr("x", m.left + 92).attr("y", m.top - 22)
        .attr("font-family", "JetBrains Mono").attr("font-size", 10)
        .attr("fill", C.inkFaint).text("/");
      metaG.append("text")
        .attr("x", m.left + 110).attr("y", m.top - 22)
        .attr("font-family", "JetBrains Mono").attr("font-size", 10)
        .attr("letter-spacing", "0.22em").style("text-transform", "uppercase")
        .attr("fill", SS_GENRE_COLOR[shapeShift.mode] || C.ink)
        .text(shapeShift.mode);
      metaG.append("text")
        .attr("class", "ss-back")
        .attr("x", W - m.right).attr("y", m.top - 22)
        .attr("text-anchor", "end")
        .attr("font-family", "JetBrains Mono").attr("font-size", 10)
        .attr("letter-spacing", "0.22em")
        .style("cursor", "pointer")
        .attr("fill", C.inkFaint)
        .text("← BACK TO ALL GENRES")
        .on("click", () => {
          shapeShift.mode = "genres";
          render();
        });
    }

    // ── Bands (the heart of the chart). Use d3 update pattern with a
    //    stable index key so paths persist across mode changes and we get
    //    smooth d-attribute interpolation between genre and archetype
    //    stacks. Number of bands differs (7 genres vs 6 archetypes), so
    //    .exit() handles the extra. ──
    // curveMonotoneX (no overshoot past endpoints) so bands cleanly stop
    // at the 2020s data point — leaves the right gutter free for labels.
    const area = d3.area()
      .x((d, i) => xS(SS_DECADES[i]))
      .y0(d => yS(d[0]))
      .y1(d => yS(d[1]))
      .curve(d3.curveMonotoneX);
    const areaFlat = d3.area()
      .x((d, i) => xS(SS_DECADES[i]))
      .y0(d => yS(d[0]))
      .y1(d => yS(d[0]))
      .curve(d3.curveMonotoneX);

    const bands = bandsG.selectAll(".ss-band")
      .data(view.stackedSeries, (d, i) => i); // stable index key
    bands.exit()
      .transition().duration(420).ease(d3.easeCubicInOut)
      .attr("opacity", 0)
      .remove();
    // Entering bands always start at baseline so the band literally grows
    // into place — feels intentional both on initial reveal and on drill
    // transitions where new bands enter (e.g. "Other" returning when going
    // back to all-genres view).
    const bandsEnter = bands.enter()
      .append("path")
      .attr("class", "ss-band")
      .attr("d", d => areaFlat(d))
      .attr("fill", d => view.color(d.key))
      .attr("data-key", d => d.key)
      .attr("opacity", 0)
      // Hover stays inert until the reveal finishes (revealComplete is
      // toggled at the end of playShapeShiftReveal). Hovering mid-reveal
      // would interrupt the band-grow transition and leave bands halfway.
      .style("pointer-events", shapeShift.revealComplete ? "all" : "none");
    const bandsAll = bandsEnter.merge(bands);
    bandsAll
      .attr("data-key", d => d.key)
      // In genre view: pointer on drillable bands. In shape view: every
      // band is a "click anywhere to go back" target.
      .style("cursor", d => (isDrilled || (!isDrilled && SS_DRILLABLE.has(d.key))) ? "pointer" : "default")
      .on("mouseenter.ss", function (e, d) {
        bandsAll.transition().duration(280).ease(d3.easeCubicInOut)
          .attr("opacity", function () {
            return this.getAttribute("data-key") === d.key ? 1 : 0.32;
          });
        labelsG.selectAll("text").transition().duration(280).ease(d3.easeCubicInOut)
          .attr("opacity", function () {
            return this.getAttribute("data-key") === d.key ? 1 : 0.4;
          });
        showTooltip(e, d.key);
      })
      .on("mousemove.ss", function (e, d) {
        positionTooltip(e);
        // In drilldown, the tooltip's decade tracks the mouse x position
        // — moving across the band scrubs through decades.
        if (isDrilled) {
          const parent = stage.getBoundingClientRect();
          const mouseX = e.clientX - parent.left;
          const dec = decadeAtX(mouseX);
          if (dec !== shapeShift._lastDecade || d.key !== shapeShift._lastKey) {
            shapeShift._lastDecade = dec;
            shapeShift._lastKey = d.key;
            updateTooltipForArch(dec, d.key);
          }
        }
      })
      .on("mouseleave.ss", function () {
        bandsAll.transition().duration(420).ease(d3.easeCubicInOut).attr("opacity", 1);
        labelsG.selectAll("text").transition().duration(420).ease(d3.easeCubicInOut).attr("opacity", 1);
        tooltip.classed("is-visible", false);
        shapeShift._lastDecade = null;
        shapeShift._lastKey = null;
      })
      .on("click.ss", function (e, d) {
        if (isDrilled) {
          // Click anywhere in the chart to return to genre view.
          shapeShift.mode = "genres";
          render();
        } else if (SS_DRILLABLE.has(d.key)) {
          shapeShift.mode = d.key;
          render();
        }
      });

    if (firstTime) {
      // Initial paint: bands sit flat at the baseline; the reveal transition
      // grows them into their stack positions and fades them up.
      bandsAll.attr("d", d => areaFlat(d));
      // Hold opacity at 0 so playShapeShiftReveal can fade them in.
    } else {
      // Subsequent renders: smoothly morph d + fill, fade opacity to 1.
      bandsAll
        .transition().duration(820).ease(d3.easeCubicInOut)
        .attr("d", d => area(d))
        .attr("fill", d => view.color(d.key))
        .attr("opacity", 1);
    }

    // ── Right-edge labels. Refresh per render with a fade transition. ──
    const labelData = view.stackedSeries
      .map(s => {
        const lastSeg = s[s.length - 1];
        const midY = (lastSeg[0] + lastSeg[1]) / 2;
        const bandH = lastSeg[1] - lastSeg[0];
        return { key: s.key, midY, bandH };
      })
      .filter(d => d.bandH >= 0.025);
    // Compute label x/y up front so entering labels land at the correct
    // coordinates immediately — no flash from (0, 0) before the
    // transition kicks in.
    const labelX = xS(SS_DECADES[SS_DECADES.length - 1]) + 12;
    const labelY = d => yS(d.midY) + 4;

    const labels = labelsG.selectAll("text")
      .data(labelData, d => d.key);
    labels.exit()
      .transition().duration(280).ease(d3.easeCubicOut).attr("opacity", 0).remove();
    const labelsEnter = labels.enter()
      .append("text")
      .attr("class", "ss-band-label")
      .attr("data-key", d => d.key)
      .attr("text-anchor", "start")
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("opacity", 0);
    const labelsAll = labelsEnter.merge(labels);
    // Same Fraunces variant in both views. Labels live in the right
    // gutter (outside the bands) for legibility; color carries the genre
    // vs shape distinction. font-family is set on labelsAll (not just
    // labelsEnter) so it's reapplied on every render — defends against
    // any inherited browser default sneaking in.
    const archMode = view.mode === "archetypes";
    labelsAll
      .attr("font-family", '"Source Serif 4", Georgia, serif')
      .attr("text-anchor", "start")
      .attr("font-weight", 500)
      .style("font-variation-settings", '"opsz" 32')
      .attr("font-size", 14)
      .attr("fill", d => archMode ? view.color(d.key) : C.inkDim)
      .attr("stroke", null)
      .attr("stroke-width", null)
      .style("paint-order", null)
      .text(d => view.label(d.key));
    // x is fixed at the right gutter; only y needs to update as bands
    // change shape between modes. Entering labels already have the
    // correct x/y from labelsEnter, so on first render no transition
    // is needed. On subsequent renders, smoothly animate continuing
    // labels to their new y; new labels appear at their target y and
    // just fade in.
    if (!firstTime) {
      labels  // existing (UPDATE) labels — slide y to new midpoint
        .transition().duration(820).ease(d3.easeCubicInOut)
        .attr("y", labelY)
        .attr("opacity", 1);
      labelsEnter  // newly entering labels — already at target y, just fade
        .transition().duration(520).ease(d3.easeCubicOut)
        .attr("opacity", 1);
    }

    // ── Caption ──
    const captionText = isDrilled
      ? `WITHIN ${shapeShift.mode.toUpperCase()} · SHARE BY DOMINANT SHAPE · HOVER FOR FILMS · CLICK ANYWHERE TO GO BACK`
      : "SHARE OF FILMS BY GENRE · CLICK A BAND TO SEE THE SHAPES INSIDE IT";
    if (firstTime) {
      caption.text(captionText);
    } else {
      caption.transition().duration(420).ease(d3.easeCubicInOut).attr("opacity", 0)
        .on("end", function () {
          d3.select(this).text(captionText)
            .transition().duration(420).ease(d3.easeCubicInOut).attr("opacity", 1);
        });
    }

    // ── Tooltip helpers ──
    function decadeAtX(mouseX) {
      let closest = SS_DECADES[0], minDist = Infinity;
      for (const dec of SS_DECADES) {
        const dist = Math.abs(mouseX - xS(dec));
        if (dist < minDist) { minDist = dist; closest = dec; }
      }
      return closest;
    }
    function positionTooltip(e) {
      const parent = stage.getBoundingClientRect();
      const ttRect = tooltip.node().getBoundingClientRect();
      const ttW = ttRect.width  > 40 ? ttRect.width  : 240;
      const ttH = ttRect.height > 40 ? ttRect.height : 130;
      const cx = e.clientX - parent.left;
      const cy = e.clientY - parent.top;
      let top = cy - ttH - 14;
      if (top < 4) top = cy + 16;
      if (top + ttH > parent.height - 4) top = Math.max(4, parent.height - ttH - 4);
      let left = cx + 16;
      if (left + ttW > parent.width - 4) left = cx - ttW - 16;
      if (left < 4) left = 4;
      tooltip.style("left", left + "px").style("top", top + "px");
    }
    function showTooltip(e, key) {
      if (isDrilled) {
        const dec = decadeAtX(e.clientX - stage.getBoundingClientRect().left);
        shapeShift._lastDecade = dec;
        shapeShift._lastKey = key;
        updateTooltipForArch(dec, key);
      } else {
        const first = view.decadeRows[0][key];
        const last  = view.decadeRows[view.decadeRows.length - 1][key];
        const delta = last - first;
        const sign  = delta >= 0 ? "+" : "−";
        const mag   = Math.abs(delta * 100).toFixed(1);
        const drillHint = SS_DRILLABLE.has(key)
          ? `<span class="hint">click to see shapes inside ${key.toLowerCase()} →</span>`
          : "";
        tooltip.html(
          `<strong>${view.label(key)}</strong>` +
          `<span class="stat">1980s <span class="num">${(first * 100).toFixed(1)}%</span> · 2020s <span class="num">${(last * 100).toFixed(1)}%</span></span>` +
          `<span class="stat">change <span class="num">${sign}${mag}pp</span></span>` +
          drillHint
        );
        tooltip.classed("is-visible", true);
      }
      positionTooltip(e);
    }
    function updateTooltipForArch(dec, key) {
      const archId = +key.slice(1);
      const genre = shapeShift.mode;
      const share = view.decadeRows[SS_DECADES.indexOf(dec)][key];
      const total = view.decadeRows[SS_DECADES.indexOf(dec)]._total || 0;
      const films = pickSampleFilms(genre, archId, dec, 4);
      const titlesHtml = films.length
        ? `<span class="titles">${films.map(t => `<em>${t}</em>`).join("")}</span>`
        : "";
      tooltip.html(
        `<strong>${view.label(key)}</strong>` +
        `<span class="shape">${view.shape(key)}</span>` +
        `<span class="stat">${dec} · <span class="num">${(share * 100).toFixed(1)}%</span> of ${genre.toLowerCase()} (${Math.round(share * total)} films)</span>` +
        titlesHtml
      );
      tooltip.classed("is-visible", true);
    }
  }

  const ensureRendered = () => {
    if (!shapeShift.rendered) {
      render();
      shapeShift.rendered = true;
    }
  };
  shapeShift._render = () => {
    // Only re-render after the initial reveal has fully completed.
    // A resize fired mid-reveal would interrupt the band-grow + opacity
    // transitions and leave bands stuck in an "in-between" state (an
    // unreveal artifact at flat / partial opacity).
    if (shapeShift.rendered && shapeShift.revealComplete) render();
  };

  if (window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: ".shape-shift-chart",
      start: "top 65%",
      once: true,
      onEnter: () => {
        try { ensureRendered(); }
        catch (err) { console.error("[shape-shift] render failed:", err); return; }
        try { playShapeShiftReveal(); }
        catch (err) { console.error("[shape-shift] reveal failed:", err); }
      },
    });
  } else {
    ensureRendered();
    playShapeShiftReveal();
  }
}

// Phased reveal — chrome stages in, then bands GROW from the baseline up
// into their stacked shape. Labels follow, with Drama (the hero) leading.
//
//   t=0.00  GRID         y-grid + 0 baseline + tick labels stagger
//   t=0.40  DECADES      decade labels stagger left→right
//   t=0.80  BREADCRUMB   "ALL FILMS" eyebrow appears
//   t=0.90  BANDS        each band's d animates from its flat-baseline
//                          shape (y0=y1) to its full stacked shape, while
//                          opacity fades 0 → 1. Stack appears to grow from
//                          the bottom up, simultaneously and gracefully.
//   t=2.40  LABELS       right-edge band labels fade in (Drama first)
//   t=3.20  CAPTION      bottom caption fades in
function playShapeShiftReveal() {
  if (shapeShift.played) return;
  shapeShift.played = true;
  const svg = d3.select(".shape-shift-svg");
  if (svg.empty()) return;
  const ease = d3.easeCubicOut;

  // Chrome.
  svg.selectAll(".ss-y-grid")
    .transition().duration(700).ease(ease)
    .attr("opacity", function () {
      return +this.getAttribute("data-zero") ? 0.7 : 0.35;
    });
  svg.selectAll(".ss-y-label")
    .transition().delay(200).duration(500).ease(ease).attr("opacity", 1);
  svg.selectAll(".ss-decade-label").each(function (_, i) {
    d3.select(this).transition().delay(400 + i * 120).duration(440).ease(ease)
      .attr("opacity", 1);
  });
  svg.selectAll(".ss-crumb-root")
    .transition().delay(800).duration(500).ease(ease).attr("opacity", 1);

  // Bands grow from baseline up into their stacked shape. Each band
  // currently has d = areaFlat (collapsed at y0=y1) and opacity = 0.
  // We transition both simultaneously so they appear to BLOOM into place.
  const stage = svg.node().parentNode;
  const r = stage.getBoundingClientRect();
  const W = Math.max(r.width, 480);
  const H = Math.max(r.height, 320);
  const m = { top: 36, right: 200, bottom: 56, left: 56 };
  const innerW = W - m.left - m.right;
  const innerH = H - m.top - m.bottom;
  const xS = d3.scalePoint().domain(SS_DECADES).range([m.left, m.left + innerW]).padding(0);
  const yS = d3.scaleLinear().domain([0, 1]).range([H - m.bottom, m.top]);
  const area = d3.area()
    .x((d, i) => xS(SS_DECADES[i]))
    .y0(d => yS(d[0]))
    .y1(d => yS(d[1]))
    .curve(d3.curveMonotoneX);

  // Open the clip-rect so bands aren't constrained on subsequent renders.
  svg.select(".ss-clip-rect")
    .attr("width", innerW);

  svg.selectAll(".ss-band")
    .transition().delay(900).duration(1300).ease(d3.easeCubicInOut)
    .attr("opacity", 1)
    .attr("d", function (d) { return area(d); });

  // Right-edge labels — Drama first (the hero), others stagger in.
  const labelOrderDelay = (key) => {
    if (key === "Drama") return 0;
    const idx = SS_GENRE_ORDER.indexOf(key);
    return 180 + idx * 100;
  };
  svg.selectAll(".ss-band-label").each(function () {
    const k = this.getAttribute("data-key");
    d3.select(this).transition()
      .delay(2400 + labelOrderDelay(k)).duration(500).ease(ease)
      .attr("opacity", 1);
  });

  svg.selectAll(".ss-caption")
    .transition().delay(3200).duration(560).ease(ease).attr("opacity", 1);

  // Wake hover only after the reveal has fully settled. Bumping
  // revealComplete + enabling pointer-events on existing bands. Future
  // renders (drilldown) read this flag and create new bands with hover
  // active immediately.
  d3.timeout(() => {
    shapeShift.revealComplete = true;
    svg.selectAll(".ss-band").style("pointer-events", "all");
  }, 3800);
}

// ─────────────────────────────────────────────────────────
// EXPLORER
const explorer = { current: null, filter: "all", showTurns: false };

// Full-corpus searchable index, built from the clustered CSV. Each entry
// has { title, year, slug } so the search can return any of the 1,627 films.
let CORPUS = [];
let CURATED_SLUGS = new Set();

function buildCorpusIndex() {
  CURATED_SLUGS = new Set(CURATED.map(c => c[2]));
  // Degrade gracefully: if the clustered CSV failed to load, search across
  // the curated set so the search bar still works rather than blowing up.
  if (!CLUSTERED) {
    CORPUS = CURATED.map(([title, year, slug]) => ({ title, year, slug }));
    return;
  }
  // String() coerce — d3.autoType turns numeric-looking titles like "1917"
  // and "300" into JS Numbers, which used to crash slugify and tear down
  // boot mid-way through buildExplorer.
  const slugify = s => String(s).toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  CORPUS = CLUSTERED.map(r => ({
    title: prettyTitle(r.title),
    year: r.year,
    slug: `${slugify(r.title)}-${r.year}`,
  }));
}

function buildExplorer() {
  // 1. Render the curated 24-film grid FIRST. This must never fail; nothing
  //    here depends on CLUSTERED, ARCH_DATA, or any async-loaded state.
  const grid = d3.select("#film-grid");
  grid.selectAll(".film-cell")
    .data(CURATED, d => d[2])
    .join("div")
    .attr("class", "film-cell")
    .attr("data-slug", d => d[2])
    .attr("data-directors", d => (d[3] || []).join(","))
    .html(([title, year]) => `${title}<span class="year">${year}</span>`)
    .on("click", function (_, d) {
      d3.selectAll(".film-cell").classed("is-active", false);
      d3.select(this).classed("is-active", true);
      loadFilm({ title: d[0], year: d[1], slug: d[2] });
    });

  // 2. Auto-load the first curated film into the chart.
  const first = grid.select(".film-cell").node();
  if (first) first.click();

  // 3. Build the search index now that the grid is committed. If CLUSTERED
  //    is missing, this falls back to the curated set (handled inside).
  try { buildCorpusIndex(); }
  catch (err) {
    console.error("[buildCorpusIndex] failed:", err);
    CORPUS = CURATED.map(([title, year, slug]) => ({ title, year, slug }));
    CURATED_SLUGS = new Set(CURATED.map(c => c[2]));
  }

  // ── search across the full corpus ──
  const input = document.getElementById("film-search");
  const list = document.getElementById("search-results");
  let focusIdx = -1;

  function rankMatches(q) {
    const ql = q.toLowerCase();
    const out = [];
    for (const f of CORPUS) {
      const tl = f.title.toLowerCase();
      const idx = tl.indexOf(ql);
      if (idx === -1) continue;
      // rank: prefix > word-start > anywhere; tiebreak by recency
      const wordStart = idx === 0 || /\s/.test(tl[idx - 1]);
      const rank = idx === 0 ? 0 : (wordStart ? 1 : 2);
      out.push({ f, rank, idx });
      if (out.length > 400) break;
    }
    out.sort((a, b) => a.rank - b.rank || a.idx - b.idx || b.f.year - a.f.year);
    return out.slice(0, 8).map(o => o.f);
  }

  function renderSuggestions(q) {
    list.innerHTML = "";
    if (!q || q.length < 2) { list.hidden = true; return; }
    const matches = rankMatches(q);
    if (!matches.length) { list.hidden = true; return; }
    matches.forEach(m => {
      const li = document.createElement("li");
      li.innerHTML = `${m.title}<span class="year">${m.year}</span>`;
      li.addEventListener("mousedown", e => {
        e.preventDefault();
        // If the film is in the curated grid, activate that cell.
        // Otherwise, just load it into the stage and clear cell selection.
        if (CURATED_SLUGS.has(m.slug)) {
          const cell = document.querySelector(`.film-cell[data-slug="${m.slug}"]`);
          if (cell) {
            cell.click();
            cell.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        } else {
          d3.selectAll(".film-cell").classed("is-active", false);
          loadFilm(m);
          document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
        }
        input.value = "";
        list.hidden = true;
      });
      list.appendChild(li);
    });
    list.hidden = false;
    focusIdx = -1;
  }
  input.addEventListener("input", e => renderSuggestions(e.target.value));
  input.addEventListener("blur", () => setTimeout(() => list.hidden = true, 150));
  input.addEventListener("focus", e => { if (e.target.value) renderSuggestions(e.target.value); });
  input.addEventListener("keydown", e => {
    const items = [...list.querySelectorAll("li")];
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      focusIdx = (focusIdx + 1) % items.length;
      items.forEach((el, i) => el.classList.toggle("is-focus", i === focusIdx));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      focusIdx = (focusIdx - 1 + items.length) % items.length;
      items.forEach((el, i) => el.classList.toggle("is-focus", i === focusIdx));
      e.preventDefault();
    } else if (e.key === "Enter" && focusIdx >= 0) {
      items[focusIdx].dispatchEvent(new MouseEvent("mousedown"));
    }
  });

  // (The director-filter tiles were dropped — search is now the primary
  // way to slice the corpus, so the filter row was clutter.)

  // turning-points toggle: shows/hides the turning-point dots on the loaded arc
  const turnInput = document.getElementById("turn-toggle");
  if (turnInput) {
    turnInput.addEventListener("change", e => {
      explorer.showTurns = e.target.checked;
      applyTurns();
    });
  }

  // Shuffle button — pick a random film from the FULL corpus and load it.
  const shuffleBtn = document.getElementById("explorer-shuffle");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      const pool = (Array.isArray(CORPUS) && CORPUS.length) ? CORPUS : CURATED.map(c => ({
        title: c[0], year: c[1], slug: c[2],
      }));
      if (!pool.length) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      loadFilm(pick);
    });
  }
}

function applyTurns() {
  const dots = d3.select(".explorer-svg").select("g.turn-dots");
  if (dots.empty()) return;
  if (explorer.showTurns) {
    dots.transition().duration(280).attr("opacity", 1)
      .selectAll("circle").attr("r", 6);
  } else {
    dots.transition().duration(220).attr("opacity", 0)
      .selectAll("circle").attr("r", 0);
  }
  d3.select("#stage-sub").text(
    explorer.showTurns
      ? "Hover a dot for the moment behind it"
      : "Toggle turning points to see the dots"
  );
}

async function loadFilm(film) {
  explorer.current = film;
  const { title, year, slug } = film;
  const svg = d3.select(".explorer-svg");
  svg.selectAll("*").remove();

  let arc, rev;
  try { arc = await d3.json(`${DATA}/arcs/${slug}_arc.json`); }
  catch (e) {
    d3.select("#stage-title").text(`${title} (not in corpus)`);
    d3.select("#stage-sub").text("");
    d3.select("#stage-blob").text("This film isn’t in the dataset yet.");
    return;
  }
  const revAll = await d3.json(`${DATA}/reversals.json`);
  rev = revAll.find(r => r.slug === slug);

  d3.select("#stage-title").text(`${title || prettyTitle(arc.title)} · ${arc.year}`);
  const nRev = rev?.reversals?.length ?? 0;
  d3.select("#stage-sub").text(
    explorer.showTurns
      ? `${nRev} TURNING POINTS · HOVER A DOT`
      : `${nRev} TURNING POINTS · TOGGLE TO REVEAL`
  );
  d3.select("#stage-blob").html(
    `<em>${arc.token_count?.toLocaleString() ?? "?"} tokens · ${arc.year}.</em>`
  );

  const rect = svg.node().getBoundingClientRect();
  const W = Math.max(rect.width, 480), H = Math.max(rect.height, 360);
  svg.attr("viewBox", `0 0 ${W} ${H}`);
  const m = { top: 36, right: 28, bottom: 36, left: 48 };

  const xs = arc.main_arc.map(p => p.position);
  const ys = arc.main_arc.map(p => p.z_score);
  const yExt = d3.extent(ys);
  const yPad = 0.6;

  const x = d3.scaleLinear().domain([0, 1]).range([m.left, W - m.right]);
  const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([H - m.bottom, m.top]);

  drawAxisFrame(svg, { x, y, x0: m.left, x1: W - m.right });

  const lineFn = d3.line()
    .x((_, i) => x(xs[i]))
    .y(d => y(d))
    .curve(d3.curveCatmullRom.alpha(0.6));

  const path = svg.append("path")
    .datum(ys)
    .attr("d", lineFn)
    .attr("fill", "none")
    .attr("stroke", C.ink)
    .attr("stroke-width", 2);

  const total = path.node().getTotalLength();
  path.attr("stroke-dasharray", `${total} ${total}`)
      .attr("stroke-dashoffset", total)
      .transition().duration(1300).ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0);

  // Compute turning points the SAME WAY the intro pin does: local extrema
  // on the rendered z_score samples, with endpoints excluded. Identical
  // math means the same film shows the same turning points in both views.
  const extrema = [];
  for (let i = 1; i < ys.length - 1; i++) {
    const isPeak   = ys[i] > ys[i - 1] && ys[i] > ys[i + 1];
    const isTrough = ys[i] < ys[i - 1] && ys[i] < ys[i + 1];
    if (isPeak || isTrough) {
      extrema.push({
        position: xs[i],
        value: ys[i],
        type: isPeak ? "peak" : "trough",
      });
    }
  }

  if (extrema.length) {
    const notes = NOTES[slug] || [];
    // Snap each extremum onto the rendered Catmull-Rom path so the dot
    // sits exactly on the line — same binary-search trick the intro pin
    // uses (path is x-monotonic; ~18 iters is plenty).
    const pathNode = path.node();
    const snapped = extrema.map(d => {
      const targetX = x(d.position);
      let lo = 0, hi = total;
      for (let it = 0; it < 18; it++) {
        const mid = (lo + hi) / 2;
        const p = pathNode.getPointAtLength(mid);
        if (p.x < targetX) lo = mid;
        else hi = mid;
      }
      const p = pathNode.getPointAtLength((lo + hi) / 2);
      return { cx: p.x, cy: p.y };
    });

    const dotsG = svg.append("g")
      .attr("class", "turn-dots")
      .attr("opacity", explorer.showTurns ? 1 : 0);
    dotsG.selectAll("circle")
      .data(extrema)
      .join("circle")
      .attr("cx", (_, i) => snapped[i].cx)
      .attr("cy", (_, i) => snapped[i].cy)
      .attr("r", 0)
      .attr("fill", C.amber)
      .attr("stroke", C.bgRaise).attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function (_, d) {
        if (!explorer.showTurns) return;
        d3.select(this).transition().duration(120).attr("r", 9);
        const i = extrema.indexOf(d);
        const note = notes[i];
        const pct = Math.round(d.position * 100);
        const label = d.type === "peak" ? "Peak" : "Trough";
        d3.select("#stage-blob").html(
          `<strong style="font-family:var(--sans);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink)">${label} · <span class="num">${pct}%</span></strong>` +
          (note ? `<span class="note">${note}</span>` : `<span class="note">[note pending]</span>`)
        );
      })
      .on("mouseleave", function () {
        if (!explorer.showTurns) return;
        d3.select(this).transition().duration(120).attr("r", 6);
      });

    if (explorer.showTurns) {
      dotsG.selectAll("circle")
        .transition().delay(1100).duration(420).attr("r", 6);
    }
  }

  // Update sub copy with the new count so it reflects the inline extrema math
  // rather than the precomputed reversals.json.
  d3.select("#stage-sub").text(
    explorer.showTurns
      ? `${extrema.length} TURNING POINTS · HOVER A DOT`
      : `${extrema.length} TURNING POINTS · TOGGLE TO REVEAL`
  );
}

// ─────────────────────────────────────────────────────────
// METHODOLOGY DRAWER
function wireMethodology() {
  const drawer = document.getElementById("meth-drawer");
  const scrim = document.getElementById("meth-scrim");
  const open = () => {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    scrim.classList.add("is-open");
    scrim.hidden = false;
  };
  const close = () => {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    scrim.classList.remove("is-open");
    setTimeout(() => { if (!scrim.classList.contains("is-open")) scrim.hidden = true; }, 320);
  };
  document.querySelectorAll("[data-meth-open]").forEach(el => {
    el.addEventListener("click", e => { e.preventDefault(); open(); });
  });
  document.querySelectorAll("[data-meth-close]").forEach(el => {
    el.addEventListener("click", e => { e.preventDefault(); close(); });
  });
  scrim.addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
}

// ─────────────────────────────────────────────────────────
// Vonnegut portrait: still photo by default, hover plays the muted clip.
// Pause + rewind on leave so the next hover always starts from frame one.
function wireVonnegutVideo() {
  const media = document.querySelector(".von-media");
  if (!media) return;
  const video = media.querySelector(".von-video");
  if (!video) return;
  const start = () => {
    media.classList.add("is-playing");
    const p = video.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };
  const stop = () => {
    media.classList.remove("is-playing");
    video.pause();
    try { video.currentTime = 0; } catch (_) {}
  };
  media.addEventListener("mouseenter", start);
  media.addEventListener("mouseleave", stop);
  media.addEventListener("focusin", start);
  media.addEventListener("focusout", stop);

  // Secondary trigger — the "on tape" link in the copy. Hover/focus there
  // also plays the clip, so the phrase and the portrait read as connected.
  document.querySelectorAll("[data-von-trigger]").forEach(el => {
    el.addEventListener("mouseenter", start);
    el.addEventListener("mouseleave", stop);
    el.addEventListener("focusin", start);
    el.addEventListener("focusout", stop);
  });
}

// ─────────────────────────────────────────────────────────
// GSAP REVEALS (intermissions, hero/closing splits, vonnegut copy)
function wireGsapReveals() {
  if (!window.gsap || !window.ScrollTrigger) {
    // GSAP failed to load — make sure scramble + hero targets stay readable.
    document.documentElement.classList.add("no-gsap");
    document.querySelectorAll(".scramble").forEach(n => n.classList.add("is-revealed"));
    return;
  }

  // Helper that primes a .scramble element (caches final text, blanks it,
  // unhides it) and returns the tween config. Used by both the hero timeline
  // and the scroll-triggered universal loop.
  const primeScramble = el => {
    const finalText = el.dataset.final || el.textContent;
    el.dataset.final = finalText;
    el.classList.add("is-revealed");
    el.textContent = "";
    // Numbers (.num) get a digit-only chars pool. Elements with an explicit
    // data-scramble-chars override (e.g. the prelude title, which uses its
    // own letters to keep width variation small) honor that. Otherwise
    // default to lowerCase. All three minimize layout shift.
    const charsPool = el.dataset.scrambleChars
      || (el.classList.contains("num") ? "0123456789," : "lowerCase");
    return {
      duration: 1.1,
      scrambleText: {
        text: finalText,
        chars: charsPool,
        revealDelay: 0.25,
        speed: 0.45,
        tweenLength: false,
      },
      ease: "none",
    };
  };

  // ── Hero entrance ──
  // Subtle fade-up on eyebrow → title → subtitle. Any .scramble inside the
  // hero (the 1,627 number in the subtitle) runs ON THE SAME TIMELINE,
  // positioned at "<" of the sub tween so it starts at the exact moment the
  // line begins fading in — locked together regardless of duration tweaks.
  if (document.querySelector(".hero-title")) {
    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(".hero .eyebrow", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" })
      .to(".hero-title",     { opacity: 1, y: 0, duration: 0.95, ease: "power3.out" }, "-=0.4")
      .to(".hero-sub",       { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" }, "-=0.4");

    document.querySelectorAll(".hero .scramble").forEach(el => {
      if (!window.ScrambleTextPlugin) {
        el.classList.add("is-revealed");
        return;
      }
      tl.to(el, primeScramble(el), "<");  // start with the .hero-sub tween
    });
  }

  // ── Universal scramble loop (everything OUTSIDE the hero) ──
  // Scrambles fire at "top 65%" — LATER in scroll than the intermission
  // fade-up at "top 75%" — so the surrounding headline has time to fade up
  // first, and the italic word then scrambles inside an already-visible h2.
  // Trigger element is the nearest block ancestor (h2/h3/section/intermission)
  // — inline spans get blanked to empty by primeScramble and ScrollTrigger
  // can mis-measure 0-width inline triggers after a layout refresh.
  document.querySelectorAll(".scramble:not(.hero .scramble)").forEach(el => {
    if (el.closest(".hero")) return;  // already handled above
    const trigger = el.closest("h1, h2, h3, .intermission, section") || el;
    if (window.ScrambleTextPlugin) {
      gsap.to(el, {
        ...primeScramble(el),
        scrollTrigger: { trigger, start: "top 65%", once: true },
      });
    } else {
      el.classList.add("is-revealed");
      gsap.from(el, {
        opacity: 0, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger, start: "top 65%", once: true },
      });
    }
  });

  // Intermissions — fade-up on eyebrow, title, sub, and warm-up's shuffle
  // button. The .scramble inside each title still does its own letter-rise
  // on top of this fade-up; they compose cleanly.
  //
  // Some intermissions sit right after large scroll-heavy sections (the
  // archetypes pin and the dialogue chart), and the reader arrives carrying
  // momentum — the original "top 85%" trigger fired before they could see
  // the reveal, so by the time they slowed down to read the text it was
  // already settled. For those, fire later so the animation lands while the
  // title is centered in the viewport. The other intermissions stay at "top
  // 85%" — that pace is right when the reader scrolls in slowly from text.
  const LATE_FIRE_INTERMISSIONS = new Set([
    "weights-prelude",        // "across time" — follows the archetypes pin
    "dialogue-genre-prelude", // "going deeper" — follows the convergence chart
    "essay-prelude",          // "and yet" — follows the dialogue chart
  ]);
  gsap.utils.toArray(".intermission").forEach(sec => {
    const trigger = sec.querySelector(".intermission-title") || sec;
    const lateFire = LATE_FIRE_INTERMISSIONS.has(sec.dataset.intermission);
    gsap.from(sec.querySelectorAll(".intermission-eyebrow, .intermission-title, .intermission-sub, .warmup-shuffle"), {
      y: 22,
      opacity: 0,
      duration: lateFire ? 1.0 : 0.7,
      stagger: lateFire ? 0.18 : 0.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger,
        // Late-fire variants wait until the title is well inside the
        // viewport (60% from top), so the animation plays as the reader
        // is settling on the section, not as they're rushing past.
        start: lateFire ? "top 60%" : "top 85%",
      },
    });
  });

  // Vonnegut subsection 1 — quiet, choreographed reveal when the section
  // enters view. Image fades up softly; caption, lede, and paragraphs
  // follow on the same timeline.
  const von1 = document.querySelector(".vonnegut-1");
  if (von1) {
    const portrait = von1.querySelector(".von-portrait img");
    const caption  = von1.querySelector(".von-portrait figcaption");
    const lede     = von1.querySelector(".lede");
    const paras    = von1.querySelectorAll("p:not(.lede)");

    const tl = gsap.timeline({
      scrollTrigger: { trigger: von1, start: "top 78%", once: true }
    });
    if (portrait) tl.from(portrait, { y: 18, opacity: 0, duration: 1.1,  ease: "power2.out" }, 0);
    if (caption)  tl.from(caption,  { y: 12, opacity: 0, duration: 0.6,  ease: "power2.out" }, "-=0.55");
    if (lede)     tl.from(lede,     { y: 22, opacity: 0, duration: 0.85, ease: "power2.out" }, "-=0.8");
    if (paras.length) tl.from(paras, {
      y: 18, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out"
    }, "-=0.55");
  }

  // Vonnegut subsection 2 — text-only block, fades up when scrolled into view.
  const von2 = document.querySelector(".vonnegut-2");
  if (von2) {
    gsap.from(von2.querySelectorAll(".lede, p"), {
      y: 32, opacity: 0, duration: 1.0, stagger: 0.12, ease: "power2.out",
      scrollTrigger: { trigger: von2, start: "top 78%", once: true }
    });
  }

  // Cluster overview — eyebrow, title, and sub all fade up with the same
  // soft stagger as the intermissions and Vonnegut copy.
  gsap.from(".cluster-overview .eyebrow, .cluster-title, .cluster-sub", {
    y: 22, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out",
    scrollTrigger: { trigger: ".cluster-overview .eyebrow", start: "top 85%", once: true }
  });

  // Weights over time — section header reveal matches every other chart
  // section so the editorial cadence is the same across the page.
  gsap.from(".weights-time .eyebrow, .weights-time-title, .weights-time-sub", {
    y: 22, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out",
    scrollTrigger: { trigger: ".weights-time .eyebrow", start: "top 85%", once: true }
  });

  // Dialogue density — same fade-up cadence as the other section headers
  // so the editorial rhythm is consistent. The chart's own staged reveal
  // (playDialogueDensityReveal) fires when the chart enters view.
  gsap.from(".dialogue-density .eyebrow, .dialogue-density-title, .dialogue-density-sub", {
    y: 22, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out",
    scrollTrigger: { trigger: ".dialogue-density .eyebrow", start: "top 85%", once: true }
  });

  // Shape shift (second reason: barcode of films per archetype) — text
  // header fades up like the other reasons, then the chart's own staged
  // reveal (playShapeShiftReveal) fires when the chart enters view.
  gsap.from(".shape-shift .eyebrow, .shape-shift-title, .shape-shift-sub", {
    y: 22, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out",
    scrollTrigger: { trigger: ".shape-shift .eyebrow", start: "top 85%", once: true }
  });

  // Explorer — same fade-up cadence as the chart sections so the "your
  // turn" handoff lands consistently with the rest of the page.
  gsap.from(".explorer .eyebrow, .explorer-head h2, .explorer-intro, .explorer-controls", {
    y: 22, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out",
    scrollTrigger: { trigger: ".explorer .eyebrow", start: "top 85%", once: true }
  });

  // Closing line — the .scramble spans on the closing title are handled by
  // the universal .scramble loop above; here we just fade in the supporting
  // line + methodology link.
  gsap.from(".closing-line, .closing .meth-link", {
    y: 30, opacity: 0, duration: 0.9, stagger: 0.15, ease: "power2.out",
    scrollTrigger: { trigger: ".closing", start: "top 75%" }
  });
}


// ─────────────────────────────────────────────────────────
// boot
async function boot() {
  // Each prep step is independent — a failure in one MUST NOT cascade and
  // wipe out the rest of the page. A bad arc fetch shouldn't take the explorer
  // grid down with it.
  try { await pickTonightsFilm(); }
  catch (err) { console.error("[pickTonightsFilm] failed:", err); }

  // Sync the intro-prelude scramble word to the current film title BEFORE
  // wireGsapReveals reads it as the scramble target.
  renderIntroPreludeLabels();

  try { await loadArchData(); }
  catch (err) { console.error("[loadArchData] failed:", err); }

  // visual jobs (each independent)
  const jobs = [
    ["hero",     drawHero],
    ["intro",    drawIntro],
    ["cluster",  drawClusterOverview],
    ["archpin",  setupArchPin],
    ["weights-time", drawWeightsTime],
    ["dialogue-density", drawDialogueDensity],
    ["shape-shift", drawShapeShift],
    ["explorer", buildExplorer],
  ];
  for (const [name, fn] of jobs) {
    try { await fn(); }
    catch (err) { console.error(`[${name}] failed:`, err); }
  }

  // Each wiring step is independent — a throw in one MUST NOT cascade
  // (an error in wireGsapReveals would otherwise break video hover and
  // the ScrollTrigger refresh below, which manifests as a stuttering
  // progress bar + broken video on hover).
  try { wireGsapReveals(); } catch (err) { console.error("[wireGsapReveals] failed:", err); }
  try { wireMethodology(); } catch (err) { console.error("[wireMethodology] failed:", err); }
  try { wireVonnegutVideo(); } catch (err) { console.error("[wireVonnegutVideo] failed:", err); }

  // Re-render layout-sensitive views on resize
  let rT;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      if (intro.relayout) intro.relayout();
      drawClusterOverview();
      if (arch.relayout) arch.relayout();
      if (weightsTime._render) weightsTime._render();
      if (dialogueDensity._render) dialogueDensity._render();
      if (shapeShift._render) shapeShift._render();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 180);
  });

  // After everything is laid out, force a ScrollTrigger refresh so the
  // archetype pin uses the correct section height.
  if (window.ScrollTrigger) {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
}

if (document.readyState === "complete") {
  boot();
} else {
  window.addEventListener("load", boot, { once: true });
}
