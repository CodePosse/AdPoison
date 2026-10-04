/**
 * Ad Poison — chaff word bank.
 *
 * Personas are coherent fake identities: a believable cluster of interests
 * is harder for ad systems to discard as noise than pure gibberish.
 * Add your own: { id, name, blurb, queries: [...] }.
 */
(function (global) {
  'use strict';

  var personas = [
    {
      id: 'beekeeper', name: 'Retired beekeeper',
      blurb: 'Hive inspections, honey extractors, and county fair ribbons.',
      queries: ['langstroth hive vs top bar hive', 'how to treat varroa mites organically', 'honey extractor 4 frame manual', 'best smoker fuel for beekeeping', 'queen bee marking colors by year', 'winterizing beehives cold climate', 'beeswax candle molds', 'county fair honey judging tips', 'swarm trap placement height', 'bee suit ventilated reviews']
    },
    {
      id: 'marine', name: 'Saltwater aquarist',
      blurb: 'Reef tanks, coral frags, and salinity obsession.',
      queries: ['beginner reef tank 40 gallon setup', 'zoanthid coral care lighting', 'protein skimmer sizing guide', 'clownfish anemone pairing', 'refractometer calibration fluid', 'live rock vs dry rock cycling', 'reef safe fish list', 'dosing alkalinity calcium magnesium', 'aquarium led par chart', 'frag rack magnetic']
    },
    {
      id: 'medieval', name: 'Medieval history buff',
      blurb: 'Castles, longbows, and illuminated manuscripts.',
      queries: ['battle of agincourt longbow range', 'how castles were heated in winter', 'illuminated manuscript gold leaf technique', 'norman conquest timeline', 'medieval guild system explained', 'trebuchet counterweight physics', 'book of kells history', 'chainmail weaving kit', 'hundred years war documentary', 'medieval recipes pottage']
    },
    {
      id: 'trucker', name: 'Long-haul trucker',
      blurb: 'Truck stops, CB radios, and logbook rules.',
      queries: ['best truck stops interstate 80', 'cb radio antenna tuning swr', 'hours of service rules 2026', '12v cooler for semi truck', 'eld device comparison owner operator', 'trucker back pain seat cushion', 'weigh station bypass apps', 'diesel exhaust fluid prices', 'sleeper cab organization ideas', 'chain laws mountain passes']
    },
    {
      id: 'violin', name: 'Adult violin learner',
      blurb: 'Rosin, Suzuki books, and practice mutes.',
      queries: ['learning violin as an adult', 'suzuki book 1 twinkle variations', 'best rosin for beginner violin', 'violin practice mute rubber', 'how to hold violin bow correctly', 'shoulder rest kun vs wolf', 'violin string brands warm tone', 'intonation tape fingerboard', 'vibrato exercises for beginners', 'violin case humidifier']
    },
    {
      id: 'mycology', name: 'Amateur mycologist',
      blurb: 'Foraging, spore prints, and grow kits.',
      queries: ['how to take a spore print', 'oyster mushroom grow kit', 'chanterelle look alikes', 'mushroom foraging knife brush', 'lions mane cultivation sawdust', 'mycology field guide northeast', 'morel season by state', 'agar plate sterile technique', 'still air box diy', 'shiitake log inoculation plugs']
    },
    {
      id: 'curling', name: 'Curling enthusiast',
      blurb: 'Brooms, stones, and the perfect draw weight.',
      queries: ['curling rules for beginners', 'curling broom head replacement', 'learn to curl league near me', 'curling shoes slider gripper', 'olympic curling highlights', 'how curling stones are made ailsa craig', 'curling strategy hammer end', 'sweeping technique curling', 'curling delivery stick', 'grand slam of curling schedule']
    },
    {
      id: 'bonsai', name: 'Bonsai hobbyist',
      blurb: 'Juniper wiring, akadama, and patience.',
      queries: ['juniper bonsai wiring technique', 'akadama soil mix ratio', 'bonsai concave cutter', 'ficus bonsai indoor care', 'when to repot bonsai', 'bonsai pot drainage mesh', 'japanese maple bonsai leaf reduction', 'bonsai shohin size', 'jin and shari carving tools', 'bonsai turntable stand']
    },
    {
      id: 'astronomy', name: 'Backyard astronomer',
      blurb: 'Dobsonians, star charts, and dark-sky trips.',
      queries: ['8 inch dobsonian telescope review', 'messier marathon checklist', 'light pollution map dark sky', 'telescope collimation laser', 'jupiter moons tonight', 'astrophotography tracking mount', 'red flashlight astronomy', 'meteor shower calendar', 'solar filter telescope safety', 'planisphere how to use']
    },
    {
      id: 'sourdough', name: 'Sourdough baker',
      blurb: 'Starters, bannetons, and oven spring.',
      queries: ['sourdough starter feeding schedule', 'banneton proofing basket', 'dutch oven bread baking temperature', 'high hydration dough shaping', 'bread lame scoring patterns', 'rye starter conversion', 'sourdough discard recipes', 'autolyse explained', 'bread flour protein content', 'cold retard overnight proof']
    },
    {
      id: 'cyclist', name: 'Gravel cyclist',
      blurb: 'Tire widths, bikepacking bags, and route planning.',
      queries: ['gravel bike tire pressure chart', 'bikepacking frame bag', 'tubeless sealant how much', 'gravel race calendar', 'cycling power meter pedals', 'chamois cream review', 'bike route planner offline maps', 'gravel bike gearing 1x vs 2x', 'cycling rain jacket packable', 'bike multitool chain breaker']
    },
    {
      id: 'genealogy', name: 'Family-tree researcher',
      blurb: 'Census records, ship manifests, and old photos.',
      queries: ['how to read 1900 census records', 'ellis island ship manifest search', 'old photograph dating by clothing', 'dna test ethnicity accuracy', 'parish records latin translation', 'archival photo storage boxes', 'genealogy software comparison', 'naturalization records search', 'cemetery headstone cleaning', 'surname origin meaning']
    },
    {
      id: 'model-trains', name: 'Model railroader',
      blurb: 'HO scale layouts, DCC, and tiny trees.',
      queries: ['ho scale layout track plan small', 'dcc decoder installation', 'model railroad scenery foam', 'n scale vs ho scale', 'weathering freight cars technique', 'model train turnout control', 'layout benchwork l girder', 'static grass applicator', 'model railroad lighting led', 'operations session car cards']
    },
    {
      id: 'opera', name: 'Opera fan',
      blurb: 'Verdi, Puccini, and season tickets.',
      queries: ['la traviata synopsis', 'best recordings of tosca', 'opera glasses binoculars', 'met opera live in hd schedule', 'difference between soprano and mezzo', 'puccini la boheme arias', 'opera libretto translation', 'wagner ring cycle beginner guide', 'what to wear to the opera', 'bel canto meaning']
    },
    {
      id: 'kayak', name: 'Sea kayaker',
      blurb: 'Tide tables, dry bags, and rolling practice.',
      queries: ['sea kayak vs touring kayak', 'eskimo roll technique', 'tide table app', 'kayak dry bag sizes', 'kayak spray skirt neoprene', 'paddle float self rescue', 'kayak roof rack j cradle', 'marine vhf handheld', 'kayak camping checklist', 'wetsuit vs drysuit kayaking']
    },
    {
      id: 'chess', name: 'Correspondence chess player',
      blurb: 'Openings, endgames, and engine analysis.',
      queries: ['caro kann main line', 'rook endgame lucena position', 'chess opening repertoire for black', 'correspondence chess rules engines', 'chess clock digital', 'kings indian defense plans', 'chess tactics puzzles daily', 'endgame tablebase explained', 'tournament chess set weighted', 'chess notation pgn reader']
    }
  ];

  // Chaos mode mixes these with random persona queries.
  var modifiers = ['best', 'cheap', 'how to', 'near me', 'review', 'diy', 'vs', 'for beginners', 'history of', 'used', 'vintage', '2026', 'guide', 'problems', 'alternatives'];
  var randomNouns = ['typewriter', 'llama wool', 'pressure washer', 'harmonica', 'tide pools', 'lighthouse', 'hot sauce', 'barometer', 'fountain pen ink', 'origami crane', 'quilting frame', 'axolotl', 'theremin', 'snow globe', 'carburetor', 'cuckoo clock', 'bird feeder', 'macrame', 'glass blowing', 'tarot deck', 'pinball machine', 'ham radio', 'cast iron skillet', 'hammock', 'abacus', 'bagpipes', 'velvet painting', 'yurt', 'tamagotchi', 'kombucha'];

  global.AP = global.AP || {};
  global.AP.wordbank = { personas: personas, modifiers: modifiers, randomNouns: randomNouns };
})(window);
