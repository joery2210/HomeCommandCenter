// Age-appropriate "Fact of the Day" library.
// A new fact is picked each day for each age group, so kids of different ages
// see different facts. Add your own by appending to any list.

export const AGE_GROUPS = [
  { id: 'little', label: 'Little Explorers', maxAge: 6 },
  { id: 'kid', label: 'Curious Kids', maxAge: 10 },
  { id: 'tween', label: 'Big Thinkers', maxAge: Infinity },
];

export function ageGroupFor(age) {
  return AGE_GROUPS.find((g) => age <= g.maxAge);
}

export const FACTS = {
  little: [
    { emoji: '🐙', text: 'An octopus has three hearts!' },
    { emoji: '🦩', text: 'A group of flamingos is called a "flamboyance."' },
    { emoji: '🍌', text: 'Bananas curve because they grow up toward the sun.' },
    { emoji: '🦋', text: 'Butterflies taste things with their feet.' },
    { emoji: '🦘', text: 'A baby kangaroo is called a joey. When it is born, it is about the size of a jelly bean.' },
    { emoji: '🦥', text: 'Sloths can hold their breath for up to 40 minutes. That is longer than dolphins!' },
    { emoji: '🍯', text: 'Honey never goes bad. People have found honey thousands of years old that could still be eaten.' },
    { emoji: '🌕', text: 'There is no wind on the Moon, so astronaut footprints there could last for millions of years.' },
    { emoji: '🐘', text: 'Elephants are the only mammals that can\'t jump.' },
    { emoji: '🦒', text: 'A giraffe\'s tongue is dark purple and almost as long as your arm.' },
    { emoji: '🦦', text: 'Sea otters hold hands while they sleep so they don\'t float away from each other.' },
    { emoji: '🌈', text: 'A rainbow has seven colors: red, orange, yellow, green, blue, indigo, and violet.' },
    { emoji: '🐸', text: 'Frogs don\'t drink with their mouths. They soak up water through their skin!' },
    { emoji: '⭐', text: 'Sea stars don\'t have a brain, but they can still find their food.' },
    { emoji: '🐱', text: 'Cats sleep for about 12 to 16 hours every day.' },
    { emoji: '🦉', text: 'Owls can turn their heads almost all the way around.' },
    { emoji: '🥕', text: 'Long ago, most carrots were purple or yellow, not orange!' },
    { emoji: '🐦', text: 'Hummingbirds are the only birds that can fly backwards.' },
    { emoji: '☀️', text: 'The Sun is a star! It is the closest star to Earth.' },
    { emoji: '🐌', text: 'Snails have thousands of teeny-tiny teeth.' },
    { emoji: '🐬', text: 'Dolphins sleep with one eye open.' },
    { emoji: '🐝', text: 'Honeybees do a wiggly dance to tell their friends where to find flowers.' },
    { emoji: '🐨', text: 'Koalas sleep up to 20 hours a day.' },
    { emoji: '🦓', text: 'No two zebras have the same stripes, just like no two people have the same fingerprints.' },
    { emoji: '🐈', text: 'A group of kittens is called a "kindle."' },
    { emoji: '❄️', text: 'Snow looks white, but each tiny ice crystal is actually clear like glass.' },
    { emoji: '🐢', text: 'Some turtles can breathe through their bottoms! 🍑' },
    { emoji: '🐼', text: 'Pandas spend about 12 hours a day eating bamboo.' },
    { emoji: '🪶', text: 'An ostrich\'s eye is bigger than its brain.' },
    { emoji: '🦎', text: 'Chameleons can move each eye on its own, so they can look in two directions at once.' },
    { emoji: '🐧', text: 'Penguins can\'t fly, but they are amazing swimmers. They "fly" underwater!' },
  ],
  kid: [
    { emoji: '🪐', text: 'Venus is the hottest planet, even though Mercury is closer to the Sun. Its thick clouds trap heat like a blanket.' },
    { emoji: '🦴', text: 'Babies are born with about 300 bones, but adults have 206. Some bones fuse together as you grow!' },
    { emoji: '⚡', text: 'A bolt of lightning is about five times hotter than the surface of the Sun.' },
    { emoji: '🦈', text: 'Sharks have been around longer than trees. Sharks appeared about 450 million years ago; trees came about 60 million years later.' },
    { emoji: '🧱', text: 'You can\'t see the Great Wall of China from the Moon with your eyes. It\'s a popular myth!' },
    { emoji: '🌗', text: 'A day on Venus is longer than a year on Venus. It spins that slowly!' },
    { emoji: '🐝', text: 'Honeybees visit around 2 million flowers to make just one pound of honey.' },
    { emoji: '🐋', text: 'The blue whale is the biggest animal that has ever lived, bigger than any dinosaur. Its heart can weigh as much as 400 pounds!' },
    { emoji: '🧊', text: 'Sometimes hot water freezes faster than cold water. It\'s called the Mpemba effect, and scientists still debate why.' },
    { emoji: '🗼', text: 'The Eiffel Tower can grow about 6 inches (15 cm) taller in summer because metal expands when it heats up.' },
    { emoji: '✨', text: 'Scientists estimate there are more stars in the universe than grains of sand on all of Earth\'s beaches.' },
    { emoji: '🪐', text: 'Saturn is so light for its size that it would float in a bathtub, if you could find one big enough.' },
    { emoji: '🐻', text: 'Tiny animals called tardigrades, or "water bears," can survive freezing, drying out, and even outer space.' },
    { emoji: '❤️', text: 'Your heart beats about 100,000 times every day.' },
    { emoji: '🐦‍⬛', text: 'Crows can recognize human faces and remember them for years.' },
    { emoji: '🌊', text: 'The Pacific Ocean is bigger than all the land on Earth put together.' },
    { emoji: '🏔️', text: 'Mount Everest grows about 4 millimeters taller every year as Earth\'s plates push together.' },
    { emoji: '🕊️', text: 'Arctic terns fly from the Arctic to Antarctica and back every year, the longest migration of any animal.' },
    { emoji: '👆', text: 'Your fingerprints formed before you were born, while you were still growing before birth.' },
    { emoji: '🔴', text: 'Jupiter\'s Great Red Spot is a storm bigger than Earth. It has been swirling for hundreds of years.' },
    { emoji: '🐆', text: 'A cheetah can run 60 to 70 miles per hour, about as fast as a car on the highway, but only for short bursts.' },
    { emoji: '🌍', text: 'Earth isn\'t a perfect ball. It bulges out a little around the middle, at the equator.' },
    { emoji: '🎍', text: 'Some kinds of bamboo can grow almost 3 feet (about 1 meter) in a single day!' },
    { emoji: '🦎', text: 'Axolotls can regrow lost legs, tails, and even parts of their heart.' },
    { emoji: '🔊', text: 'Sound travels about four times faster through water than through air.' },
    { emoji: '💻', text: 'Ada Lovelace is called the first computer programmer. She wrote her program in 1843, more than 100 years before modern computers!' },
    { emoji: '🦛', text: 'Hippos can\'t really swim. They walk or bounce along the bottom of rivers.' },
    { emoji: '🌙', text: 'The Moon drifts about 1.5 inches (3.8 cm) farther from Earth every year.' },
    { emoji: '🦉', text: 'A group of owls is called a "parliament."' },
    { emoji: '🐸', text: 'Glass frogs have see-through bellies. You can actually watch their hearts beating!' },
    { emoji: '⏱️', text: 'The shortest war in history, between Britain and Zanzibar in 1896, lasted only about 38 minutes.' },
  ],
  tween: [
    { emoji: '🧬', text: 'If you uncoiled the DNA from just one of your cells, it would stretch about 2 meters (6 feet) long.' },
    { emoji: '☀️', text: 'Sunlight takes about 8 minutes and 20 seconds to reach Earth, so you always see the Sun as it looked 8 minutes ago.' },
    { emoji: '🎓', text: 'Oxford University is older than the Aztec Empire. Teaching there began around 1096; the Aztec city of Tenochtitlan was founded in 1325.' },
    { emoji: '🏛️', text: 'Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid of Giza.' },
    { emoji: '🍌', text: 'Bananas are very slightly radioactive because they contain potassium-40. Totally safe to eat, though!' },
    { emoji: '🧠', text: 'Your brain is only about 2% of your body weight, but it uses about 20% of your energy.' },
    { emoji: '🃏', text: 'There are more ways to shuffle a deck of cards (52! ≈ 8×10⁶⁷) than there are atoms on Earth. A well-shuffled deck is almost certainly in an order no one has ever seen.' },
    { emoji: '🌟', text: 'Neutron stars are so dense that a single teaspoon of one would weigh about a billion tons.' },
    { emoji: '🎂', text: 'The Birthday Paradox: in a room of just 23 people, there\'s a better than 50% chance two of them share a birthday.' },
    { emoji: '🟫', text: 'Wombats are the only animals known to make cube-shaped poop. The shape helps it stay put when they mark their territory.' },
    { emoji: '🐙', text: 'About two-thirds of an octopus\'s neurons are in its arms, not its head. Each arm can react on its own.' },
    { emoji: '👁️', text: 'The human eye can tell apart roughly a million different colors.' },
    { emoji: '🍄', text: 'Many trees are linked by underground fungal networks that can move water and nutrients between them.' },
    { emoji: '💎', text: 'Scientists think it may "rain" diamonds deep inside Neptune and Uranus, thanks to crushing pressure on carbon.' },
    { emoji: '🪐', text: 'Pluto hasn\'t finished a single orbit since it was discovered in 1930. One Pluto year lasts about 248 Earth years.' },
    { emoji: '⚔️', text: 'The Hundred Years\' War between England and France actually lasted 116 years (1337–1453).' },
    { emoji: '💧', text: 'Water covers about 71% of Earth\'s surface, but only about 1% of all water is fresh water we can easily use.' },
    { emoji: '🤖', text: 'The word "robot" comes from the Czech word "robota," meaning forced labor. It was first used in a 1920 play.' },
    { emoji: '🌅', text: 'Venus spins backward compared to most planets, so on Venus the Sun rises in the west.' },
    { emoji: '🫃', text: 'Your stomach grows a fresh lining every few days so its own acid doesn\'t digest it.' },
    { emoji: '🛰️', text: 'Voyager 1, launched in 1977, is the farthest human-made object. It is now in interstellar space.' },
    { emoji: '🦗', text: 'Some cicadas live underground for 13 or 17 years, both prime numbers, which may help them avoid predators on regular cycles.' },
    { emoji: '🏜️', text: 'About 6,000 to 10,000 years ago, the Sahara Desert was green, with grasslands, lakes, and hippos.' },
    { emoji: '🌊', text: 'Tiny ocean plants called phytoplankton make roughly half of the oxygen on Earth.' },
    { emoji: '🏔️', text: 'Everest is the highest mountain above sea level, but Ecuador\'s Chimborazo peak is the point farthest from Earth\'s center, thanks to the planet\'s bulge.' },
    { emoji: '0️⃣', text: 'Zero as a number with its own rules was worked out by Indian mathematicians. Brahmagupta wrote them down in 628 CE.' },
    { emoji: '🌕', text: 'The Moon always shows Earth the same face because it spins exactly once for each trip around us. It\'s called tidal locking.' },
    { emoji: '⚛️', text: 'Atoms are mostly empty space. If an atom\'s nucleus were a marble, the whole atom would be about the size of a football stadium.' },
    { emoji: '🌶️', text: 'Birds can\'t feel the burn of chili peppers. Capsaicin only affects mammals, so birds eat the peppers and spread the seeds.' },
    { emoji: '🌐', text: 'The first message ever sent over ARPANET, the internet\'s ancestor, in 1969 was "LO". The system crashed before "LOGIN" finished.' },
    { emoji: '☁️', text: 'A typical fluffy cumulus cloud weighs about 1.1 million pounds, roughly as much as 100 elephants.' },
  ],
};

// Stable "fact of the day": same fact all day, a new one tomorrow.
// `offset` lets kids tap "another one!" to browse ahead.
export function factOfTheDay(groupId, date = new Date(), offset = 0) {
  const list = FACTS[groupId];
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  const index = (((dayNumber + offset) % list.length) + list.length) % list.length;
  return list[index];
}
